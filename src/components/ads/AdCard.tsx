import { Link, useNavigate } from 'react-router-dom';
import { Ad } from '@/types/ad';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { FileImage, Building2, Info } from 'lucide-react';

interface AdCardProps {
  ad: Ad;
  viewMode?: 'grid' | 'list';
}

export function AdCard({ ad, viewMode = 'grid' }: AdCardProps) {
  const navigate = useNavigate();
  const sizeSpec = ad.size_spec;
  const hasPreview = ad.selected_version_preview;

  const handleInfoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/ads/${ad.id}/detail`);
  };

  // List view - compact horizontal layout
  if (viewMode === 'list') {
    return (
      <Link to={`/ads/${ad.id}`}>
        <Card className="card-hover group cursor-pointer overflow-hidden">
          <div className="flex items-center gap-4 p-3">
            {/* Small thumbnail */}
            <div className="w-16 h-12 bg-muted/50 rounded overflow-hidden flex-shrink-0">
              {hasPreview ? (
                <img 
                  src={ad.selected_version_preview!} 
                  alt={ad.client_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Ad name & client */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {ad.ad_name || ad.client_name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {ad.ad_name ? ad.client_name : ''}
              </p>
            </div>

            {/* Publication */}
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground w-32 flex-shrink-0">
              {ad.publications && (
                <>
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{ad.publications.name}</span>
                </>
              )}
            </div>

            {/* Size */}
            <div className="hidden md:block font-mono-spec text-muted-foreground text-sm w-28 flex-shrink-0">
              {sizeSpec.width}×{sizeSpec.height}px
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              <StatusBadge status={ad.status} />
            </div>

            {/* Updated */}
            <div className="hidden lg:block text-xs text-muted-foreground w-24 text-right flex-shrink-0">
              {formatDistanceToNow(new Date(ad.updated_at), { addSuffix: true })}
            </div>

            {/* Info button */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={handleInfoClick}
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </Link>
    );
  }

  // Grid view - original card layout
  return (
    <Link to={`/ads/${ad.id}`}>
      <Card className="card-hover group cursor-pointer overflow-hidden">
        {/* Thumbnail */}
        <div className="aspect-[4/3] bg-muted/50 relative overflow-hidden">
          {hasPreview ? (
            <img 
              src={ad.selected_version_preview!} 
              alt={ad.client_name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
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
              <span className="text-xs text-muted-foreground/70 font-medium">No preview</span>
            </div>
          )}
          {/* Info button - top left */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 left-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleInfoClick}
          >
            <Info className="w-4 h-4" />
          </Button>
          <div className="absolute top-2 right-2">
            <StatusBadge status={ad.status} />
          </div>
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {ad.ad_name || ad.client_name}
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
