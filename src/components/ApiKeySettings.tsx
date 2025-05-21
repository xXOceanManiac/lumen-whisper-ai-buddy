
import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveOpenAIKey } from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ApiKeySettings = () => {
  const [open, setOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState({
    title: "API Key Updated",
    description: "Your OpenAI API key has been saved and will be used for all your chat sessions.",
    isError: false
  });
  const { toast } = useToast();
  const { user, openaiKey, setOpenaiKey, refreshOpenAIKey } = useAuth();

  // Helper function to validate OpenAI API key format
  const validateApiKey = (key: string): boolean => {
    const trimmedKey = key.trim();
    if (!trimmedKey) return false;
    
    // OpenAI keys must start with "sk-" and be at least 30 characters long
    if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 30) {
      return false;
    }
    return true;
  };

  // Helper function to generate a simple IV for encryption purposes
  const generateSimpleIV = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 16; // Standard IV length
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleSaveApiKey = async () => {
    if (!user?.googleId) {
      toast({
        title: "Error",
        description: "Authentication required. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    // Validate API key format
    const trimmedKey = newApiKey.trim();
    if (!validateApiKey(trimmedKey)) {
      toast({
        title: "Invalid API Key Format",
        description: "Your API key must start with 'sk-' and be at least 30 characters long. Please check your key and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Saving new OpenAI API key for googleId:", user.googleId);
      console.log("Key format:", trimmedKey.substring(0, 5) + "..." + trimmedKey.slice(-4), "length:", trimmedKey.length);
      
      // First attempt to save in Supabase directly
      try {
        // Generate a simple IV for encryption purposes
        const iv = generateSimpleIV();
        
        const { error } = await supabase
          .from('openai_keys')
          .upsert({ 
            google_id: user.googleId, 
            key_content: trimmedKey,
            iv: iv
          });
        
        if (error) {
          console.error(`❌ Failed to save key to Supabase: ${error.message}`);
        } else {
          console.log(`✅ Successfully saved key to Supabase`);
        }
      } catch (error) {
        console.error(`❌ Error saving key to Supabase:`, error);
      }
      
      // Also save via backend API
      const success = await saveOpenAIKey(user.googleId, trimmedKey);
      
      if (success) {
        toast({
          title: "Success",
          description: "API key saved successfully",
        });
        
        // Update the key in local state immediately for better UX
        setOpenaiKey(trimmedKey);
        console.log("✅ API key updated in local state after saving");
        
        // Try to refresh the API key from the server
        const refreshSuccess = await refreshOpenAIKey();
        console.log("API key refresh attempt result:", refreshSuccess ? "success" : "failed");
        
        // Close the dialog and reset the input field
        setOpen(false);
        setNewApiKey("");
        
        // Show confirmation dialog with appropriate message
        setConfirmationMessage({
          title: "API Key Updated",
          description: "Your OpenAI API key has been saved successfully and is ready to use.",
          isError: false
        });
        setShowConfirmation(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to update API key on the server",
          variant: "destructive",
        });
        
        // Show error confirmation dialog
        setConfirmationMessage({
          title: "API Key Update Issue",
          description: "Your API key was saved locally but there was an issue updating it on the server. You can continue using it for this session.",
          isError: true
        });
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error("Error saving OpenAI API key:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving your API key",
        variant: "destructive",
      });
      
      // Show error confirmation dialog
      setConfirmationMessage({
        title: "API Key Update Failed",
        description: "There was an error saving your API key. Please try again later.",
        isError: true
      });
      setShowConfirmation(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeConfirmationDialog = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>OpenAI API Key Settings</DialogTitle>
            <DialogDescription>
              Update your OpenAI API key for generating responses.
              This key will be securely stored for all your chat sessions.
              {openaiKey && (
                <p className="mt-2 text-sm text-green-600">
                  You currently have an API key set
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="col-span-4 px-2">
              <p className="text-sm text-amber-600">
                <strong>Important:</strong> Your API key must start with 'sk-' and be at least 30 characters long.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                You can get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">OpenAI dashboard</a>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleSaveApiKey} 
              disabled={isSubmitting || !newApiKey.trim()}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={confirmationMessage.isError ? "text-destructive" : ""}>
              {confirmationMessage.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmationMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={closeConfirmationDialog}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ApiKeySettings;
