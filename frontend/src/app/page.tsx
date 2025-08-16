import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold mb-4'>Welcome to Mediearn</h1>
          <p className='text-xl text-muted-foreground mb-8'>
            A decentralized content platform where creators can monetize their
            articles
          </p>
          <div className='flex gap-4 justify-center'>
            <Button variant='outline'>Start Writing</Button>
            <Button variant='outline'>Explore Articles</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
