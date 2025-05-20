
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

const ApiKeySettings = () => {
  const [open, setOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, refreshOpenAIKey } = useAuth();

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim() || !user?.googleId) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Saving new OpenAI API key for googleId:", user.googleId);
      const success = await saveOpenAIKey(user.googleId, newApiKey);
      
      if (success) {
        toast({
          title: "Success",
          description: "API key updated successfully",
        });
        
        // Refresh the API key in the auth context
        await refreshOpenAIKey();
        
        // Close the dialog and reset the input field
        setOpen(false);
        setNewApiKey("");
      } else {
        toast({
          title: "Error",
          description: "Failed to update API key",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving OpenAI API key:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
};

export default ApiKeySettings;
