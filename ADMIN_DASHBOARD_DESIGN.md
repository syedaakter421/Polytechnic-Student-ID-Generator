# অ্যাডমিন ড্যাশবোর্ড পেজ ডিজাইন স্পেসিফিকেশন (`Admin Dashboard Design`)

এই ডকুমেন্টটি **Polytechnic Student ID Generator** ওয়েবসাইটের **অ্যাডমিন ড্যাশবোর্ডের (`/admin/*`)** সম্পূর্ণ UI/UX ডিজাইন, কালার সিস্টেম, টাইপোগ্রাফি, সাইডবার ও হেডার শেল, এবং সকল সাব-পেজ ও মডালের কাঠামো নির্ধারণ করে।

---

## ১. কালার প্যালেট (Color Palette)

| ব্যবহার | কালার নাম / টোকেন | হেক্স কোড |
| :--- | :--- | :--- |
| **প্রাইমারি অ্যাকসেন্ট (অ্যাক্টিভ মেনু, বাটন, প্রিন্ট)** | `gov-green` | `#006a4e` |
| **ডার্ক গ্রিন (হোভার স্টেট)** | `gov-green-dark` | `#004d48` |
| **লগআউট ও ডিলিট অ্যাকসেন্ট** | `gov-red` / `red-600` | `#f42a41` / `#dc2626` |
| **মেইন ব্যাকগ্রাউন্ড** | `slate-50` | `#f8fafc` |
| **কার্ড, সাইডবার ও হেডার সারফেস** | `white` | `#ffffff` |
| **কার্ড ও সাইডবার বর্ডার** | `slate-200` / `slate-100` | `#e2e8f0` / `#f1f5f9` |
| **স্ট্যাটস কার্ড (মোট স্টুডেন্ট)** | `blue-600` | `#2563eb` |
| **স্ট্যাটস কার্ড (প্রিন্টেড কার্ড)** | `purple-600` | `#9333ea` |

### স্ট্যাটাস ব্যাজ কালার ম্যাপিং
| স্ট্যাটাস | ব্যাকগ্রাউন্ড | টেক্সট কালার | বর্ডার |
| :--- | :--- | :--- | :--- |
| `pending` (অপেক্ষমান) | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| `approved` (অনুমোদিত) | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` |
| `processing` (প্রসেসিং) | `bg-blue-50` | `text-blue-700` | `border-blue-200` |
| `printed` (প্রিন্টেড) | `bg-purple-50` | `text-purple-700` | `border-purple-200` |
| `rejected` (প্রত্যাখ্যাত) | `bg-red-50` | `text-red-700` | `border-red-200` |

---

## ২. টাইপোগ্রাফি (Typography)

- **প্রাইমারি ফন্ট (English & Numbers):** `"Inter", ui-sans-serif, system-ui, sans-serif`
- **বাংলা ফন্ট (`font-bengali`):** `"Hind Siliguri", sans-serif`
- **হায়ারার্কি:**
  - টপ হেডার শিরোনাম: `text-[11px] sm:text-sm md:text-lg lg:text-xl font-black text-slate-800 font-bengali`
  - সেকশন শিরোনাম: `text-xl md:text-2xl font-black/bold text-slate-800 font-bengali`
  - সাইডবার ব্র্যান্ড শিরোনাম: `text-sm font-black text-slate-800 font-bengali`
  - সাবটাইটেল / মাইক্রো লেবেল: `text-[9px]–[11px] font-black uppercase tracking-widest text-slate-400`

---

## ৩. মূল অ্যাডমিন লেআউট শেল (Admin Shell)

রুট লেআউট: `min-h-screen admin-page flex bg-slate-50 relative overflow-x-hidden`

### ক. বাম সাইডবার (`Sidebar`)
- **প্রস্থ ও স্টাইল:** `w-72 bg-white border-r border-slate-200 p-4 shadow-xl` (ডেস্কটপে স্থায়ী, মোবাইলে স্লাইড-ইন ড্রয়ার + `bg-slate-900/60 backdrop-blur-sm` ওভারলে)।
- **ব্র্যান্ডিং বক্স:** `w-12 h-12 rounded-xl border border-slate-200` লোগো (`/images/logo.png`) + `এডমিন প্যানেল` (`ADMIN PANEL`)।
- **নেভিগেশন সেকশন (`SYSTEM CONTROL`):**
  1. `Dashboard` (`/admin`) — `LayoutDashboard` আইকন
  2. `Student List` (`/admin/students`) — `Users` আইকন
  3. `PDF Verification` (`/admin/registry`) — `FileUp` আইকন
  4. `Reports` (`/admin/reports`) — `FileText` আইকন
  5. `Settings` (`/admin/settings`) — `Settings` আইকন
  6. `Profile Settings` (`/admin/profile`) — `User` আইকন
- **অ্যাক্টিভ মেনু স্টাইল:** `bg-gov-green text-white shadow-lg shadow-gov-green/20 rounded-xl`
- **ইনঅ্যাক্টিভ মেনু স্টাইল:** `text-slate-600 hover:bg-gov-green/5 hover:text-gov-green rounded-xl`
- **লগআউট বাটন:** নিচে আলাদা বিভাজকের পর `text-gov-red hover:bg-gov-red/5 font-bold` (`Logout Session`)।

### খ. টপ স্টিকি হেডার (`Header`)
- **স্টাইল:** `bg-white py-4 border-b border-slate-200 px-4 md:px-8 sticky top-0 z-50 shadow-sm`
- **বাম অংশ:** মোবাইলের জন্য হ্যামবার্গার মেনু বাটন + শিরোনাম: `বাংলাদেশ কারিগরি শিক্ষা বোর্ড - সেন্ট্রাল ডাটাবেস` (`সেন্ট্রাল ডাটাবেস` অংশটি `text-gov-green`)।
- **ডান অংশ:** অ্যাডমিনের নাম, প্রতিষ্ঠানের নাম (`SHERPUR GOVT. POLYTECHNIC INSTITUTE`), প্রতিষ্ঠানের লোগো বক্স (`rounded-xl md:rounded-2xl`) এবং লাল Sign Out আইকন বাটন (`bg-red-50 text-red-600`)।

### গ. মেইন কনটেন্ট ও ফুটার
- কনটেন্ট এরিয়া: `p-4 md:p-6 lg:p-8 flex-1 bg-slate-50`
- নিচে গ্লোবাল `<Footer />` কম্পোনেন্ট।

---

## ৪. অ্যাডমিন ড্যাশবোর্ডের সাব-পেজসমূহ

### ১. Dashboard (`/admin` — `AdminHome`)
- **২টি স্ট্যাটস কার্ড (`grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6`):**
  - `StatsCard` ডিজাইন: `bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4`, বাম পাশে `w-2 h-12 rounded-full` কালার বার।
  - কার্ড ১: `মোট স্টুডেন্ট` (`bg-blue-600`)
  - কার্ড ২: `প্রিন্টেড কার্ড` (`bg-purple-600`)
- **সাম্প্রতিক রেজিস্ট্রেশন কার্ড (`bg-white rounded-2xl shadow-sm border border-gray-100`):**
  - হেডারে `সাম্প্রতিক রেজিস্ট্রেশন` শিরোনাম ও ডানে `সব দেখুন` পিল বাটন (`/admin/students`)।
  - টেবিল কলাম: `Student Name` | `Technology` | `Roll`।

### ২. Student List (`/admin/students` — `StudentManagement`)
- **টপ ফিল্টার ও সার্চ বার:**
  - `সকল টেকনোলজি` ড্রপডাউন
  - `সকল সেশন` ড্রপডাউন
  - কার্ড স্ট্যাটাস ফিল্টার (`সকল আইডি কার্ড`, `নতুন আইডি কার্ড`, `মেয়াদ উত্তীর্ণ আইডি কার্ড`)
  - সার্চ ইনপুট (`Search by Name or Roll...`, বাম পাশে `<Search />` আইকন)
- **বাল্ক অ্যাকশন বার (চেকবক্স সিলেক্ট করলে প্রদর্শিত হয়):**
  - `bg-gov-green/5 border border-gov-green/20 p-4 rounded-2xl`
  - নির্বাচিত সংখ্যা ব্যাজ + বাল্ক স্ট্যাটাস পরিবর্তনের ড্রপডাউন + `নির্বাচন বাতিল` বাটন।
- **ডেস্কটপ টেবিল (`hidden md:block`):**
  - কলাম: চেকবক্স | `Student` (ছবি + ইংরেজি/বাংলা নাম) | `Details` (টেকনোলজি, রোল, সেশন) | `Status` (ইনলাইন স্ট্যাটাস ড্রপডাউন) | `Actions` (চোখ আইকন: Details, প্রিন্টার আইকন: ID Card Preview, ডাস্টবিন আইকন: Delete)।
- **মোবাইল কার্ড ভিউ (`md:hidden`):**
  - প্রতি কার্ডে চেকবক্স, থাম্বনেইল ছবি, নাম, রোল, ইনলাইন স্ট্যাটাস সিলেক্ট এবং ডান পাশে `Details` বাটন (`bg-gov-green text-white rounded-xl`)।
- **পেজিনেশন (`Pagination`):**
  - প্রতি পেজে ৩০ জন করে (`ITEMS_PER_PAGE = 30`), নিচে পেজ নম্বর বাটন (`bg-gov-green` অ্যাক্টিভ স্টেট)।

#### Student List-এর মডালসমূহ
- **শিক্ষার্থীর তথ্য মডাল (`modalMode === 'details'`):**
  - `max-w-4xl rounded-[32px] shadow-2xl`
  - বাম পাশে `max-w-[240px] rounded-[40px]` ছবি ও স্ট্যাটাস সিলেক্ট বক্স।
  - ডান পাশে ২-কলাম গ্রিডে সকল ব্যক্তিগত ও একাডেমিক তথ্য (`DetailItem`), নিচে `স্থায়ী ঠিকানা`, এবং `আইডি কার্ড প্রিন্ট` ও `ডিলেট করুন` বাটন।
- **আইডি কার্ড প্রিভিউ মডাল (`modalMode === 'idcard'`):**
  - `<IDCard />` কম্পোনেন্ট প্রদর্শন ও PNG/PDF ডাউনলোড।
- **ডিলিট কনফার্মেশন মডাল:**
  - `max-w-md rounded-[32px] p-8 text-center`
  - লাল সতর্কতা আইকন (`<AlertTriangle size={32} />`), নিশ্চিতকরণ বার্তা এবং `বাতিল` / `হ্যাঁ, ডিলিট করুন` বাটন।
- **ব্যাচ ডাউনলোড প্রোগ্রেস ওভারলে:**
  - `bg-slate-900/80 backdrop-blur-md` এর ওপর সাদা কার্ড (`rounded-[32px]`) এবং সবুজ প্রোগ্রেস বার।

### ৩. PDF Verification (`/admin/registry` — `StudentRegistryManagement`)
- **৩টি স্ট্যাটস কার্ড (`grid-cols-1 sm:grid-cols-3 gap-4`):**
  - `মোট রেকর্ড` (`gov-green`)
  - `সাইন আপ সম্পন্ন` (`emerald-600`)
  - `সাইন আপ বাকি` (`amber-600`)
- **PDF / CSV আপলোড কার্ড (`bg-white rounded-3xl border-slate-100`):**
  - হেডারে `PDF / CSV আপলোড` + `একক এন্ট্রি` বাটন।
  - ড্যাশড ফাইল পিকার (`.pdf,.csv`) + `প্রিভিউ দেখুন` বাটন।
  - প্রিভিউ টেবিলে `Roll`, `Reg`, `Name` ইনলাইন এডিট করে `ডাটাবেজে সেভ করুন` সুবিধা।
- **শিক্ষার্থী তালিকা কার্ড:**
  - সার্চ বক্স (`নাম বা রোল খুঁজুন...`) এবং টেবিল (`Name`, `Roll`, `Reg`, `Status` [`সক্রিয়`/`বাকি`], ডিলিট আইকন)।

### ৪. Settings (`/admin/settings` — `SettingsManagement`)
- **কনটেইনার:** `bg-white p-4 md:p-8 rounded-[24px] md:rounded-[32px] shadow-xl border border-slate-100`
- **সেকশনসমূহ (`bg-slate-50 p-6 rounded-3xl`):**
  - **আইডি কার্ড টেম্পলেট:** `Sherpur Official` অ্যাক্টিভ সিলেকশন কার্ড (`border-2 border-gov-green bg-gov-green/5`)।
  - **আইডি কার্ড লোগো:** ড্যাশড আপলোড ড্রপজোন + লোগো সংক্রান্ত নির্দেশনা।
  - **স্বাক্ষর আপলোড (২ কলাম):** `অধ্যক্ষের স্বাক্ষর (Principal)` এবং `রেজিস্ট্রারের স্বাক্ষর (Registrar)`।
- নিচে `সেটিংস সংরক্ষণ করুন` বাটন (`bg-gov-green rounded-2xl shadow-xl`)।

### ৫. Profile Settings (`/admin/profile` — `AdminProfile`)
- **কনটেইনার:** `max-w-2xl mx-auto bg-white p-8 rounded-[32px] shadow-xl border border-slate-100`
- **ফর্ম ফিল্ডসমূহ:**
  - `Full Name` ইনপুট
  - `New Password (Optional)` (`Eye` / `EyeOff` টগলসহ)
  - `Confirm New Password` (`Eye` / `EyeOff` টগলসহ)
- নিচে ফুল-উইডথ `আপডেট করুন` বাটন (`bg-gov-green py-5 rounded-2xl`)।

---

## ৫. রেসপন্সিভ আচরণ (Responsiveness)

- **মোবাইল (`< 768px`):** স্লাইড-ওভার সাইডবার ড্রয়ার, স্টুডেন্ট লিস্টে কার্ড-ভিত্তিক তালিকা, স্ট্যাটস কার্ডগুলো ১ কলামে।
- **ট্যাবলেট (`768px – 1023px`):** স্টুডেন্ট লিস্টে ডেস্কটপ টেবিল চালু হয়, ২-কলাম গ্রিড লেআউট।
- **ডেস্কটপ (`>= 1024px`):** বাম পাশে স্থায়ী `w-72` সাইডবার (`lg:translate-x-0 lg:static`), কনটেন্ট এরিয়ায় পূর্ণ প্রশস্ত টেবিল ও ৩-কলাম গ্রিড।
