import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { migrateLocalStorageToSupabase, clearLocalStorage, backupLocalStorage } from '@/utils/migration';
import { useToast } from '@/hooks/use-toast';

export const MigrationPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    success: boolean;
    transactionsMigrated: number;
    holdingsMigrated: number;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    setIsLoading(true);
    try {
      // Show backup download option
      const backup = backupLocalStorage();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(backup);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `crypto-backup-${new Date().toISOString()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      // Perform migration
      const result = await migrateLocalStorageToSupabase();
      setMigrationStatus(result);

      if (result.success) {
        toast({
          title: "Migration Successful",
          description: result.message,
        });
        
        // Optionally clear local storage after successful migration
        setTimeout(() => {
          clearLocalStorage();
          toast({
            title: "Cleanup Complete",
            description: "Local storage has been cleared. Your data is now safely stored in Supabase.",
          });
        }, 2000);
      } else {
        toast({
          title: "Migration Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Error",
        description: "An error occurred during migration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Database Migration</CardTitle>
        <CardDescription>
          Migrate your data from Local Storage to Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This will backup your current data and migrate it to Supabase. A backup file will be downloaded.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleMigration}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Migrating...' : 'Start Migration'}
        </Button>

        {migrationStatus && (
          <Alert variant={migrationStatus.success ? 'default' : 'destructive'}>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">{migrationStatus.message}</p>
                {migrationStatus.success && (
                  <>
                    <p>✓ Transactions migrated: {migrationStatus.transactionsMigrated}</p>
                    <p>✓ Holdings migrated: {migrationStatus.holdingsMigrated}</p>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MigrationPanel;
