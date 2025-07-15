import { Music } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <Music className="w-5 h-5" />
        </div>
        <span className="text-xl font-bold font-headline tracking-tighter">
            Amplifyd
        </span>
    </div>
  );
}
