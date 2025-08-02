import { EventEmitter } from 'events';
import { AgentMessage } from '@/types/orchestration';

interface MessageHandler {
  id: string;
  pattern: string | RegExp;
  handler: (message: AgentMessage) => void | Promise<void>;
}

interface MessageRoute {
  from?: string;
  to?: string;
  action?: string;
  type?: string;
}

export class MessageBus extends EventEmitter {
  private handlers: Map<string, MessageHandler> = new Map();
  private messageLog: AgentMessage[] = [];
  private maxLogSize: number = 1000;
  private routingRules: Map<string, MessageRoute[]> = new Map();

  constructor() {
    super();
    this.setupDefaultRoutes();
  }

  private setupDefaultRoutes(): void {
    // Broadcast routes for system-wide messages
    this.addRoute('orchestrator', {
      to: '*',
      type: 'status'
    });

    // Agent collaboration routes
    this.addRoute('sourcing', {
      to: 'enrichment',
      action: 'enrich_candidates'
    });

    this.addRoute('planning', {
      to: 'sourcing',
      action: 'execute_search'
    });

    this.addRoute('enrichment', {
      to: 'sourcing',
      action: 'candidate_enriched'
    });
  }

  public publish(message: AgentMessage): void {
    // Log message
    this.logMessage(message);

    // Emit for direct subscribers
    this.emit('message', message);
    this.emit(`message:${message.type}`, message);
    this.emit(`message:${message.from}:${message.to}`, message);

    // Process handlers
    this.processHandlers(message);

    // Apply routing rules
    this.applyRoutingRules(message);
  }

  public subscribe(
    pattern: string | RegExp,
    handler: (message: AgentMessage) => void | Promise<void>
  ): string {
    const handlerId = `handler-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.handlers.set(handlerId, {
      id: handlerId,
      pattern,
      handler
    });

    return handlerId;
  }

  public unsubscribe(handlerId: string): boolean {
    return this.handlers.delete(handlerId);
  }

  public subscribeToAgent(
    agentId: string,
    handler: (message: AgentMessage) => void
  ): string {
    return this.subscribe(
      new RegExp(`^${agentId}$`),
      (message) => {
        if (message.to === agentId || message.from === agentId) {
          handler(message);
        }
      }
    );
  }

  public subscribeToAction(
    action: string,
    handler: (message: AgentMessage) => void
  ): string {
    return this.subscribe(
      action,
      (message) => {
        if (message.action === action) {
          handler(message);
        }
      }
    );
  }

  private processHandlers(message: AgentMessage): void {
    this.handlers.forEach(handler => {
      try {
        let shouldHandle = false;

        if (typeof handler.pattern === 'string') {
          // String pattern matching
          shouldHandle = 
            message.action === handler.pattern ||
            message.from === handler.pattern ||
            message.to === handler.pattern;
        } else {
          // RegExp pattern matching
          shouldHandle = 
            handler.pattern.test(message.action) ||
            handler.pattern.test(message.from) ||
            handler.pattern.test(message.to);
        }

        if (shouldHandle) {
          Promise.resolve(handler.handler(message)).catch(error => {
            console.error(`Handler ${handler.id} error:`, error);
            this.emit('handler:error', { handlerId: handler.id, error });
          });
        }
      } catch (error) {
        console.error(`Error processing handler ${handler.id}:`, error);
      }
    });
  }

  private applyRoutingRules(message: AgentMessage): void {
    const agentRules = this.routingRules.get(message.from) || [];
    
    agentRules.forEach(rule => {
      if (this.matchesRoute(message, rule)) {
        this.routeMessage(message, rule);
      }
    });
  }

  private matchesRoute(message: AgentMessage, route: MessageRoute): boolean {
    if (route.to && route.to !== '*' && message.to !== route.to) {
      return false;
    }

    if (route.action && message.action !== route.action) {
      return false;
    }

    if (route.type && message.type !== route.type) {
      return false;
    }

    return true;
  }

  private routeMessage(message: AgentMessage, route: MessageRoute): void {
    if (route.to === '*') {
      // Broadcast to all agents
      this.emit('broadcast', message);
    } else {
      // Route to specific destination
      const routedMessage: AgentMessage = {
        ...message,
        correlationId: message.id
      };
      
      this.emit('route', routedMessage);
    }
  }

  public addRoute(fromAgent: string, route: MessageRoute): void {
    const existingRoutes = this.routingRules.get(fromAgent) || [];
    existingRoutes.push(route);
    this.routingRules.set(fromAgent, existingRoutes);
  }

  public removeRoute(fromAgent: string, route: MessageRoute): void {
    const routes = this.routingRules.get(fromAgent) || [];
    const filtered = routes.filter(r => 
      r.to !== route.to || 
      r.action !== route.action || 
      r.type !== route.type
    );
    
    if (filtered.length > 0) {
      this.routingRules.set(fromAgent, filtered);
    } else {
      this.routingRules.delete(fromAgent);
    }
  }

  private logMessage(message: AgentMessage): void {
    this.messageLog.push(message);
    
    // Maintain log size limit
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog = this.messageLog.slice(-this.maxLogSize);
    }
  }

  public getMessageLog(filter?: {
    from?: string;
    to?: string;
    action?: string;
    type?: string;
    startTime?: Date;
    endTime?: Date;
  }): AgentMessage[] {
    if (!filter) {
      return [...this.messageLog];
    }

    return this.messageLog.filter(message => {
      if (filter.from && message.from !== filter.from) return false;
      if (filter.to && message.to !== filter.to) return false;
      if (filter.action && message.action !== filter.action) return false;
      if (filter.type && message.type !== filter.type) return false;
      if (filter.startTime && message.timestamp < filter.startTime) return false;
      if (filter.endTime && message.timestamp > filter.endTime) return false;
      
      return true;
    });
  }

  public clearMessageLog(): void {
    this.messageLog = [];
  }

  public getMetrics(): any {
    const messagesByType = this.messageLog.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const messagesByAgent = this.messageLog.reduce((acc, msg) => {
      acc[msg.from] = (acc[msg.from] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMessages: this.messageLog.length,
      messagesByType,
      messagesByAgent,
      activeHandlers: this.handlers.size,
      routingRules: this.routingRules.size
    };
  }
}