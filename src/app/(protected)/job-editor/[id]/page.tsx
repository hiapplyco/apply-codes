import JobEditorWrapper from './wrapper';

export const revalidate = 0;

export async function generateStaticParams() {
  return [];
}

export default function JobEditorRoute() {
  return <JobEditorWrapper />;
}
