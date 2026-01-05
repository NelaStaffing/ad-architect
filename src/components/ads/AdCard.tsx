import { Link } from 'react-router-dom';
import { Ad } from '@/types/ad';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { FileImage, Building2 } from 'lucide-react';

interface AdCardProps {
  ad: Ad;
}

export function AdCard({ ad }: AdCardProps) {
  const sizeSpec = ad.size_spec;
  
  return (
    <Link to={`/ads/${ad.id}`}>
      <Card className="card-hover group cursor-pointer overflow-hidden">
        {/* Thumbnail placeholder */}
        <div className="aspect-[4/3] bg-muted/50 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="bg-secondary/50 border border-border rounded flex items-center justify-center"
              style={{
                width: `${Math.min(80, (sizeSpec.width / sizeSpec.height) * 60)}%`,
                height: `${Math.min(80, (sizeSpec.height / sizeSpec.width) * 60)}%`,
                maxWidth: '80%',
                maxHeight: '80%',
              }}
            >
              <FileImage className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <StatusBadge status={ad.status} />
          </div>
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {ad.client_name}
          </h3>
          {ad.publications && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Building2 className="w-3 h-3" />
              <span className="truncate">{ad.publications.name}</span>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="px-3 pb-3 pt-0 flex items-center justify-between">
          <span className="font-mono-spec text-muted-foreground">
            {sizeSpec.width}×{sizeSpec.height}px
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(ad.updated_at), { addSuffix: true })}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
