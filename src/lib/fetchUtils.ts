
export async function safeFetch(url: string, options?: RequestInit) {
  let attempts = 0;
  const maxAttempts = (options?.method || 'GET') === 'GET' ? 2 : 1;
  const timeout = 30000; // 30 seconds

  while (attempts < maxAttempts) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        if (text.includes("Cookie check") || text.includes("Action required to load your app")) {
          throw new Error("AUTH_REQUIRED: কন্টেন্ট লোড করার জন্য অনুগ্রহ করে প্রিভিউ স্ক্রিনে একবার ক্লিক করুন অথবা পেজটি রিফ্রেশ করুন।");
        }
        throw new Error("সার্ভার থেকে সঠিক রেসপন্স পাওয়া যায়নি। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।");
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "An unexpected error occurred.");
      }
      
      return data;
    } catch (error: any) {
      attempts++;
      
      if (error.name === 'AbortError') {
        throw new Error("সার্ভার থেকে উত্তর পেতে অনেক সময় লাগছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }

      if (error.message === "Failed to fetch" && attempts < maxAttempts) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      if (error.message === "Failed to fetch") {
        throw new Error("সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হচ্ছে না। অনুগ্রহ করে আপনার ইন্টারনেট কানেকশন চেক করুন এবং পেজটি রিফ্রেশ করুন।");
      }
      throw error;
    }
  }
}
