import { useState, useEffect } from "react";
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
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const { toast } = useToast();
  const { user, openaiKey, setOpenaiKey, refreshOpenAIKey } = useAuth();

  // Set initial API key value when dialog opens
  useEffect(() => {
    if (open && openaiKey) {
      setNewApiKey(openaiKey);
      setIsKeyValid(validateApiKey(openaiKey));
    }
  }, [open, openaiKey]);

  // Live validation as user types
  useEffect(() => {
    if (newApiKey) {
      const isValid = validateApiKey(newApiKey);
      setIsKeyValid(isValid);
      
      if (newApiKey.trim() === "") {
        setValidationMessage("");
      } else if (!newApiKey.startsWith('sk-')) {
        setValidationMessage("API key must start with 'sk-'");
      } else if (newApiKey.length < 48) {
        setValidationMessage(`API key too short (${newApiKey.length}/48 characters)`);
      } else {
        setValidationMessage("Valid API key format ✓");
      }
    } else {
      setIsKeyValid(false);
      setValidationMessage("");
    }
  }, [newApiKey]);

  // Helper function to validate OpenAI API key format
  const validateApiKey = (key: string): boolean => {
    const trimmedKey = key.trim();
    if (!trimmedKey) return false;
    
    // OpenAI keys must start with "sk-" and be at least 48 characters long
    // Also support sk-proj-* keys which can be 164+ characters
    if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 48) {
      return false;
    }
    return true;
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
        description: "Your API key must start with 'sk-' and be at least 48 characters long. Please check your key and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("🔄 Saving new OpenAI API key for googleId:", user.googleId);
      console.log("Key format:", trimmedKey.substring(0, 7) + "...", "length:", trimmedKey.length);
      
      // Send the full API key to the server for encryption and storage using updated route
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
          description: "Your OpenAI API key has been encrypted and saved successfully and is ready to use.",
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
      console.error("❌ Error saving OpenAI API key:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving your API key",
        variant: "destructive",
      });
      
      // Show error confirmation dialog
      setConfirmationMessage({
        title: "API Key Update Failed",
        description: "There was an error encrypting or saving your API key. Please try again later.",
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
              Your key will be encrypted and securely stored.
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
                className={`col-span-3 ${
                  newApiKey && !isKeyValid ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
              />
            </div>
            <div className="col-span-4 px-2">
              {validationMessage && (
                <p className={`text-sm ${
                  isKeyValid ? "text-green-600" : "text-amber-600"
                }`}>
                  {validationMessage}
                </p>
              )}
              <p className="text-sm text-amber-600 mt-2">
                <strong>Important:</strong> Your API key must start with 'sk-' and be at least 48 characters long.
                We support both standard OpenAI keys and project-based keys (sk-proj-*).
              </p>
              <p className="text-xs text-gray-500 mt-1">
                You can get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">OpenAI dashboard</a>.
                Your key will be encrypted before storage.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleSaveApiKey} 
              disabled={isSubmitting || !newApiKey.trim() || !isKeyValid}
            >
              {isSubmitting ? "Encrypting & Saving..." : "Save changes"}
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
