import { UnifiedContentCreator } from "@/components/content/UnifiedContentCreator";

const ContentCreationPage = () => {
  return (
    <div className="container py-8 mx-auto">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-primary">Content Creation Hub</h1>
        <p className="text-muted-foreground">
          Create professional recruitment content with AI-powered assistance
        </p>
      </div>
      
      <UnifiedContentCreator />
    </div>
  );
};

export default ContentCreationPage;