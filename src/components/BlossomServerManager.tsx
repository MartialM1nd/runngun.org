import { useState, useEffect } from 'react';
import { Plus, X, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/hooks/useAppContext';
import { useToast } from '@/hooks/useToast';

export function BlossomServerManager() {
  const { config, updateConfig } = useAppContext();
  const { toast } = useToast();

  const [servers, setServers] = useState<string[]>(config.blossomServers);
  const [newServerUrl, setNewServerUrl] = useState('');

  useEffect(() => {
    setServers(config.blossomServers);
  }, [config.blossomServers]);

  const normalizeServerUrl = (url: string): string => {
    url = url.trim();
    try {
      return new URL(url).toString();
    } catch {
      try {
        return new URL(`https://${url}`).toString();
      } catch {
        return url;
      }
    }
  };

  const isValidServerUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) return false;

    const normalized = normalizeServerUrl(trimmed);
    try {
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddServer = () => {
    if (!isValidServerUrl(newServerUrl)) {
      toast({
        title: 'Invalid server URL',
        description: 'Please enter a valid Blossom server URL (e.g., https://blossom.example.com/)',
        variant: 'destructive',
      });
      return;
    }

    const normalized = normalizeServerUrl(newServerUrl);

    if (servers.some(s => s === normalized)) {
      toast({
        title: 'Server already exists',
        description: 'This Blossom server is already in your list.',
        variant: 'destructive',
      });
      return;
    }

    const newServers = [...servers, normalized];
    setServers(newServers);
    setNewServerUrl('');

    saveServers(newServers);
  };

  const handleRemoveServer = (url: string) => {
    const newServers = servers.filter(s => s !== url);
    setServers(newServers);
    saveServers(newServers);
  };

  const saveServers = (newServers: string[]) => {
    updateConfig((current) => ({
      ...current,
      blossomServers: newServers,
    }));

    toast({
      title: 'Blossom servers updated',
      description: 'Server settings have been saved locally.',
    });
  };

  const renderServerUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      if (parsed.pathname === '/') {
        return parsed.host;
      } else {
        return parsed.host + parsed.pathname;
      }
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {servers.map((server) => (
          <div
            key={server}
            className="flex items-center gap-3 p-3 rounded-md border bg-muted/20"
          >
            <Server className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-mono text-sm flex-1 truncate" title={server}>
              {renderServerUrl(server)}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveServer(server)}
              className="size-5 text-muted-foreground hover:text-destructive hover:bg-transparent shrink-0"
              disabled={servers.length <= 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="new-blossom-server" className="sr-only">
            Blossom Server URL
          </Label>
          <Input
            id="new-blossom-server"
            placeholder="Enter Blossom server URL (e.g., https://blossom.example.com/)"
            value={newServerUrl}
            onChange={(e) => setNewServerUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddServer();
              }
            }}
          />
        </div>
        <Button
          onClick={handleAddServer}
          disabled={!newServerUrl.trim()}
          variant="outline"
          size="sm"
          className="h-10 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Server
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Blossom servers are used for uploading images and files. Settings are stored locally.
      </p>
    </div>
  );
}
