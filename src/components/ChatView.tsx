const handleSubmit = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();
  console.log("🔥 handleSubmit triggered");

  const isInputValid = !!input.trim();
  console.log("💡 Submit enabled:", isInputValid, "Processing:", isProcessing);

  if (!isInputValid || isProcessing) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: input,
    timestamp: Date.now()
  };

  setMessages(prev => [...prev, userMessage]);
  setInput("");
  setIsProcessing(true);

  try {
    if (!openaiKey) {
      console.warn("⛔ openaiKey is missing");
      toast({
        title: "API Key Required",
        description: "No OpenAI API key found. Please refresh your key or check your account settings.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    const googleId = currentUser?.googleId;

    console.log("📩 Submitting message with:", {
      googleId,
      openaiKey,
      input,
      fullUser: currentUser,
      messages: [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });

    if (!googleId) {
      console.warn("⚠️ No googleId! Cannot send chat request.");
      setIsProcessing(false);
      return;
    }

    const response = await callChatApi([...messages, userMessage], openaiKey, googleId);

    console.log("✅ Response from backend:", response);

    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: response.content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, assistantMessage]);

    if (response.calendarEvent) {
      console.log("📅 Calendar event detected:", response.calendarEvent);
    }
  } catch (error) {
    console.error("❌ Error sending message:", error);
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsProcessing(false);
  }
};
