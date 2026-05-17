export interface Student {
  id: number;
  full_name_bn: string;
  full_name_en: string;
  roll_number: string;
  reg_number: string;
  session: string;
  technology: string;
  semester: string;
  shift: string;
  blood_group: string;
  mobile: string;
  email: string;
  dob: string;
  address: string;
  village?: string;
  post_office?: string;
  upazilla?: string;
  district?: string;
  valid_upto?: string;
  father_name: string;
  mother_name: string;
  guardian_mobile: string;
  student_mobile: string;
  photo_path: string;
  status: 'pending' | 'approved' | 'rejected';
  is_downloaded: number;
  created_at: string;
}

export interface User {
  id: number;
  full_name?: string;
  username?: string;
  role: 'student' | 'admin';
  // Student fields
  full_name_bn?: string;
  full_name_en?: string;
  roll_number?: string;
  reg_number?: string;
  technology?: string;
  semester?: string;
  shift?: string;
  photo_path?: string;
  status?: string;
  blood_group?: string;
  email?: string;
  mobile?: string;
  student_mobile?: string;
  address?: string;
  village?: string;
  post_office?: string;
  upazilla?: string;
  district?: string;
  valid_upto?: string;
  session?: string;
  is_downloaded?: number;
  dob?: string;
  father_name?: string;
  mother_name?: string;
  guardian_mobile?: string;
  signature_path?: string;
}

export interface SystemSettings {
  id_card_template: 'classic' | 'modern' | 'minimal' | 'gradient' | 'custom' | 'sherpur';
  principal_signature_path?: string;
  registrar_signature_path?: string;
  custom_template_front_path?: string;
  custom_template_back_path?: string;
  show_hologram: boolean;
  expiry_years: number;
  field_positions?: string; // JSON string of positions
}
