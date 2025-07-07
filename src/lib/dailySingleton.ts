import DailyIframe, { DailyCall } from "@daily-co/daily-js";

class DailySingleton {
  private static instance: DailySingleton;
  private dailyCall: DailyCall | null = null;
  private isCreating: boolean = false;
  private creationPromise: Promise<DailyCall> | null = null;

  private constructor() {}

  static getInstance(): DailySingleton {
    if (!DailySingleton.instance) {
      DailySingleton.instance = new DailySingleton();
    }
    return DailySingleton.instance;
  }

  async getOrCreateCallFrame(
    container: HTMLElement,
    roomUrl: string,
    options?: any
  ): Promise<DailyCall> {
    // If we're already creating, wait for that to complete
    if (this.isCreating && this.creationPromise) {
      console.log("Daily instance creation already in progress, waiting...");
      try {
        const existingFrame = await this.creationPromise;
        // If the frame exists and matches the room URL, return it
        if (existingFrame && this.dailyCall && roomUrl === this.dailyCall.properties?.url) {
          console.log("Returning existing frame for same room");
          return existingFrame;
        }
      } catch (e) {
        console.error("Error waiting for existing creation:", e);
      }
    }

    // If we already have an instance with a different room URL, destroy it first
    if (this.dailyCall && this.dailyCall.properties?.url !== roomUrl) {
      console.log("Destroying existing Daily instance for different room");
      try {
        await this.destroyCallFrame();
      } catch (e) {
        console.error("Error destroying existing Daily instance:", e);
      }
    } else if (this.dailyCall) {
      // Same room URL, return existing instance
      console.log("Returning existing Daily instance for same room");
      return this.dailyCall;
    }

    // Create new instance
    this.isCreating = true;
    this.creationPromise = new Promise(async (resolve, reject) => {
      try {
        console.log("Creating new Daily instance for room:", roomUrl);
        
        // Clean up any lingering Daily instances
        const existingDaily = (window as any).DailyIframe;
        if (existingDaily && existingDaily._instances && existingDaily._instances.length > 0) {
          console.log("Found lingering Daily instances, cleaning up...");
          existingDaily._instances.forEach((instance: any) => {
            try {
              if (instance && instance.destroy) {
                instance.destroy();
              }
            } catch (e) {
              console.error("Error cleaning up lingering instance:", e);
            }
          });
          existingDaily._instances = [];
        }

        const frame = DailyIframe.createFrame(container, {
          showLeaveButton: true,
          showFullscreenButton: true,
          url: roomUrl,
          theme: {
            colors: {
              accent: '#9b87f5',
              accentText: '#FFFFFF',
              background: '#F8F5FF',
              backgroundAccent: '#EDE9FF',
              baseText: '#4A2B1C',
              border: '#7E69AB',
              mainAreaBg: '#2C1810',
              mainAreaBgAccent: '#4A2B1C',
              mainAreaText: '#FFFFFF',
              supportiveText: '#8B6B5C',
            },
          },
          iframeStyle: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '8px',
            zIndex: '1',
          },
          ...options,
        });

        await frame.load();
        this.dailyCall = frame;
        console.log("Daily instance created and loaded successfully");
        
        // Automatically join the meeting after loading
        console.log("Joining meeting...");
        try {
          // Set a longer timeout for joining (30 seconds)
          const joinPromise = frame.join();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Join timeout after 30 seconds")), 30000)
          );
          
          await Promise.race([joinPromise, timeoutPromise]);
          console.log("Successfully joined meeting");
        } catch (joinError) {
          console.error("Error joining meeting:", joinError);
          // Don't fail the whole creation - user can still manually join
          console.log("Frame created successfully, but auto-join failed. User can manually join.");
        }
        
        resolve(frame);
      } catch (error) {
        console.error("Error creating Daily instance:", error);
        reject(error);
      } finally {
        this.isCreating = false;
        this.creationPromise = null;
      }
    });

    return this.creationPromise;
  }

  async destroyCallFrame(): Promise<void> {
    if (this.dailyCall) {
      console.log("Destroying Daily call frame");
      try {
        await this.dailyCall.destroy();
        this.dailyCall = null;
      } catch (e) {
        console.error("Error destroying Daily call frame:", e);
        this.dailyCall = null;
      }
    }
  }

  getCallFrame(): DailyCall | null {
    return this.dailyCall;
  }

  isActive(): boolean {
    return this.dailyCall !== null;
  }
}

export const dailySingleton = DailySingleton.getInstance();