import { EmbeddedChat } from '@/components/chat/EmbeddedChat';

const Chat = () => {
  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
      <EmbeddedChat height="h-full" className="flex-1" />
    </div>
  );
};

export default Chat;
