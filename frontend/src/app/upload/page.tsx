import { UploadForm } from "@/components/uploadForm";

export default function UploadPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Upload Article</h1>
        <p className='text-gray-600'>
          Share your knowledge and monetize your content
        </p>
      </div>

      <UploadForm />
    </div>
  );
}
