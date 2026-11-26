
function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function logoutAndRedirectHome(): Promise<never> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/');
  }
  return new Promise<never>(() => {});
}

export async function safeFetch(url: string, options?: RequestInit) {
  let attempts = 0;
  const maxAttempts = (options?.method || 'GET') === 'GET' ? 2 : 1;
  const timeout = 30000; // 30 seconds

  // Extract existing headers safely
  const headers: Record<string, string> = {};
  if (options && options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  // Inject Bearer token if present inside localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  if (token && isAdminRoute && isJwtExpired(token)) {
    return logoutAndRedirectHome();
  }

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers
  };

  while (attempts < maxAttempts) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        if (typeof window !== 'undefined' && (isAdminRoute || localStorage.getItem('token'))) {
          return logoutAndRedirectHome();
        }
        const text = await response.text();
        if (text.includes("Cookie check") || text.includes("Action required to load your app")) {
          throw new Error("AUTH_REQUIRED: কন্টেন্ট লোড করার জন্য অনুগ্রহ করে প্রিভিউ স্ক্রিনে একবার ক্লিক করুন অথবা পেজটি রিফ্রেশ করুন।");
        }
        throw new Error("সার্ভার থেকে সঠিক রেসপন্স পাওয়া যায়নি। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।");
      }
      
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          if (typeof window !== 'undefined' && (isAdminRoute || localStorage.getItem('token'))) {
            return logoutAndRedirectHome();
          }
        }
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
