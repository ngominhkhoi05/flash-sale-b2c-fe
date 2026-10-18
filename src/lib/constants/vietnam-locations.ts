/**
 * Dữ liệu hành chính Tỉnh / Thành phố – Quận / Huyện – Phường / Xã của Việt Nam.
 * Dùng cho cascade dropdown chọn địa chỉ (Sổ địa chỉ người mua & Kho hàng người bán).
 */

export interface WardOption {
  code: string;
  name: string;
}

export interface DistrictOption {
  code: string;
  name: string;
  wards: string[];
}

export interface ProvinceOption {
  code: string;
  name: string;
  districts: Record<string, string[]>;
}

export const VIETNAM_LOCATIONS: Record<string, Record<string, string[]>> = {
  "Hồ Chí Minh": {
    "Quận 1": ["Phường Bến Nghé", "Phường Bến Thành", "Phường Cầu Kho", "Phường Cầu Ông Lãnh", "Phường Cô Giang", "Phường Đa Kao", "Phường Nguyễn Cư Trinh", "Phường Nguyễn Thái Bình", "Phường Phạm Ngũ Lão", "Phường Tân Định"],
    "Quận 3": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 9", "Phường 11", "Phường 14", "Phường Võ Thị Sáu"],
    "Quận 7": ["Phường Tân Thuận Đông", "Phường Tân Thuận Tây", "Phường Tân Kiểng", "Phường Tân Hưng", "Phường Bình Thuận", "Phường Tân Quy", "Phường Phú Thuận", "Phường Tân Phú", "Phường Tân Phong", "Phường Phú Mỹ"],
    "Quận 9": ["Phường Tăng Nhơn Phú A", "Phường Tăng Nhơn Phú B", "Phường Hiệp Phú", "Phường Long Thạnh Mỹ", "Phường Long Bình", "Phường Long Phước", "Phường Long Trường", "Phường Phước Bình", "Phường Phước Long A", "Phường Phước Long B"],
    "TP. Thủ Đức": ["Phường Linh Trung", "Phường Linh Tây", "Phường Linh Chiểu", "Phường Linh Đông", "Phường Tam Bình", "Phường Tam Phú", "Phường Bình Chiểu", "Phường Hiệp Bình Chánh", "Phường Hiệp Bình Phước"],
    "Quận Bình Thạnh": ["Phường 1", "Phường 2", "Phường 3", "Phường 5", "Phường 6", "Phường 7", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 17", "Phường 19", "Phường 21", "Phường 22", "Phường 24", "Phường 25", "Phường 26", "Phường 27", "Phường 28"],
    "Quận Tân Bình": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"],
    "Quận Gò Vấp": ["Phường 1", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16", "Phường 17"],
    "Quận 10": ["Phường 1", "Phường 2", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"],
  },
  "Hà Nội": {
    "Quận Cầu Giấy": ["Phường Dịch Vọng", "Phường Dịch Vọng Hậu", "Phường Mai Dịch", "Phường Nghĩa Đô", "Phường Nghĩa Tân", "Phường Quan Hoa", "Phường Trung Hòa", "Phường Yên Hòa"],
    "Quận Ba Đình": ["Phường Cống Vị", "Phường Điện Biên", "Phường Đội Cấn", "Phường Giảng Võ", "Phường Kim Mã", "Phường Liễu Giai", "Phường Ngọc Hà", "Phường Ngọc Khánh", "Phường Nguyễn Trung Trực", "Phường Phúc Xá", "Phường Quán Thánh", "Phường Thành Công", "Phường Trúc Bạch", "Phường Vĩnh Phúc"],
    "Quận Đống Đa": ["Phường Cát Linh", "Phường Hàng Bột", "Phường Khâm Thiên", "Phường Khương Thượng", "Phường Kim Liên", "Phường Láng Hạ", "Phường Láng Thượng", "Phường Nam Đồng", "Phường Ô Chợ Dừa", "Phường Phương Liệt", "Phường Phương Mai", "Phường Quang Trung", "Phường Quốc Tử Giám", "Phường Thịnh Quang", "Phường Thổ Quan", "Phường Trung Liệt", "Phường Trung Phụng", "Phường Trung Tự", "Phường Văn Chương", "Phường Văn Miếu"],
    "Quận Hoàn Kiếm": ["Phường Chương Dương", "Phường Cửa Đông", "Phường Cửa Nam", "Phường Đồng Xuân", "Phường Hàng Bạc", "Phường Hàng Bài", "Phường Hàng Bồ", "Phường Hàng Bông", "Phường Hàng Buồm", "Phường Hàng Đào", "Phường Hàng Gai", "Phường Hàng Mã", "Phường Hàng Trống", "Phường Lý Thái Tổ", "Phường Phan Chu Trinh", "Phường Phúc Tân", "Phường Tràng Tiền", "Phường Trần Hưng Đạo"],
    "Quận Nam Từ Liêm": ["Phường Cầu Diễn", "Phường Đại Mỗ", "Phường Mễ Trì", "Phường Mỹ Đình 1", "Phường Mỹ Đình 2", "Phường Phú Đô", "Phường Phương Canh", "Phường Tây Mỗ", "Phường Trung Văn", "Phường Xuân Phương"],
    "Quận Thanh Xuân": ["Phường Hạ Đình", "Phường Khương Đình", "Phường Khương Mai", "Phường Khương Trung", "Phường Kim Giang", "Phường Nhân Chính", "Phường Phương Liệt", "Phường Thanh Xuân Bắc", "Phường Thanh Xuân Nam", "Phường Thanh Xuân Trung", "Phường Thượng Đình"],
    "Quận Hai Bà Trưng": ["Phường Bách Khoa", "Phường Bạch Đằng", "Phường Bạch Mai", "Phường Cầu Dền", "Phường Đống Mác", "Phường Đồng Nhân", "Phường Đồng Tâm", "Phường Lê Đại Hành", "Phường Minh Khai", "Phường Nguyễn Du", "Phường Phạm Đình Hổ", "Phường Phố Huế", "Phường Quỳnh Lôi", "Phường Quỳnh Mai", "Phường Thanh Lương", "Phường Thanh Nhàn", "Phường Trương Định", "Phường Vĩnh Tuy"],
  },
  "Đà Nẵng": {
    "Quận Hải Châu": ["Phường Hải Châu 1", "Phường Hải Châu 2", "Phường Thạch Thang", "Phường Thanh Bình", "Phường Thuận Phước", "Phường Hòa Thuận Tây", "Phường Hòa Thuận Đông", "Phường Nam Dương", "Phường Bình Hiên", "Phường Bình Thuận", "Phường Hòa Cường Bắc", "Phường Hòa Cường Nam"],
    "Quận Thanh Khê": ["Phường Tam Thuận", "Phường Thanh Khê Tây", "Phường Thanh Khê Đông", "Phường Xuân Hà", "Phường Tân Chính", "Phường Chính Gián", "Phường Vĩnh Trung", "Phường Thạc Gián", "Phường An Khê", "Phường Hòa Khê"],
    "Quận Sơn Trà": ["Phường An Hải Bắc", "Phường An Hải Đông", "Phường An Hải Tây", "Phường Mân Thái", "Phường Nại Hiên Đông", "Phường Phước Mỹ", "Phường Thọ Quang"],
    "Quận Ngũ Hành Sơn": ["Phường Mỹ An", "Phường Khuê Mỹ", "Phường Hòa Quý", "Phường Hòa Hải"],
    "Quận Liên Chiểu": ["Phường Hòa Hiệp Bắc", "Phường Hòa Hiệp Nam", "Phường Hòa Khánh Bắc", "Phường Hòa Khánh Nam", "Phường Hòa Minh"],
  },
  "Bình Dương": {
    "TP. Thủ Dầu Một": ["Phường Phú Cường", "Phường Hiệp Thành", "Phường Chánh Nghĩa", "Phường Phú Thọ", "Phường Phú Hòa", "Phường Phú Lợi", "Phường Phú Tân", "Phường Định Hòa", "Phường Hiệp An", "Phường Chánh Mỹ", "Phường Tương Bình Hiệp", "Phường Tân An", "Phường Hòa Phú"],
    "TP. Dĩ An": ["Phường Dĩ An", "Phường An Bình", "Phường Tân Đông Hiệp", "Phường Đông Hòa", "Phường Tân Bình", "Phường Bình An", "Phường Bình Thắng"],
    "TP. Thuận An": ["Phường Lái Thiêu", "Phường An Thạnh", "Phường Vĩnh Phú", "Phường Bình Hòa", "Phường Thuận Giao", "Phường Bình Chuẩn", "Phường An Phú", "Phường Hưng Định", "Xã An Sơn"],
  },
  "Đồng Nai": {
    "TP. Biên Hòa": ["Phường An Bình", "Phường An Hòa", "Phường Bình Đa", "Phường Bửu Hòa", "Phường Bửu Long", "Phường Hiệp Hòa", "Phường Hóa An", "Phường Hòa Bình", "Phường Hố Nai", "Phường Long Bình", "Phường Long Bình Tân", "Phường Quang Vinh", "Phường Quyết Thắng", "Phường Tam Hiệp", "Phường Tam Hòa", "Phường Tân Biên", "Phường Tân Hạnh", "Phường Tân Hiệp", "Phường Tân Hòa", "Phường Tân Mai", "Phường Tân Phong", "Phường Tân Tiến", "Phường Tân Vạn", "Phường Thanh Bình", "Phường Thống Nhất", "Phường Trảng Dài", "Phường Trung Dũng"],
    "Huyện Long Thành": ["Thị trấn Long Thành", "Xã An Phước", "Xã Bàu Cạn", "Xã Bình An", "Xã Bình Sơn", "Xã Cẩm Đường", "Xã Lộc An", "Xã Long An", "Xã Long Đức", "Xã Phước Bình", "Xã Phước Thái", "Xã Tam An", "Xã Tân Hiệp"],
  },
  "Cần Thơ": {
    "Quận Ninh Kiều": ["Phường An Bình", "Phường An Cư", "Phường An Hòa", "Phường An Khánh", "Phường An Nghiệp", "Phường Cái Khế", "Phường Hưng Lợi", "Phường Tân An", "Phường Thới Bình", "Phường Xuân Khánh"],
    "Quận Cái Răng": ["Phường Ba Láng", "Phường Hưng Phú", "Phường Hưng Thạnh", "Phường Lê Bình", "Phường Phú Thứ", "Phường Tân Phú"],
  },
  "Hải Phòng": {
    "Quận Hồng Bàng": ["Phường Hạ Lý", "Phường Hoàng Văn Thụ", "Phường Hùng Vương", "Phường Minh Khai", "Phường Phan Bội Châu", "Phường Quán Toan", "Phường Sở Dầu", "Phường Thượng Lý", "Phường Trại Chuối"],
    "Quận Ngô Quyền": ["Phường Cầu Đất", "Phường Cầu Tre", "Phường Đằng Giang", "Phường Đông Khê", "Phường Đồng Quốc Bình", "Phường Gia Viên", "Phường Lạc Viên", "Phường Lạch Tray", "Phường Lê Lợi", "Phường Máy Chai", "Phường Máy Tơ", "Phường Vạn Mỹ"],
  },
  "Khánh Hòa": {
    "TP. Nha Trang": ["Phường Lộc Thọ", "Phường Ngọc Hiệp", "Phường Phước Hải", "Phường Phước Hòa", "Phường Phước Long", "Phường Phước Tân", "Phường Phước Tiến", "Phường Phương Sài", "Phường Phương Sơn", "Phường Tân Lập", "Phường Vạn Thắng", "Phường Vạn Thạnh", "Phường Vĩnh Hải", "Phường Vĩnh Hòa", "Phường Vĩnh Nguyên", "Phường Vĩnh Phước", "Phường Vĩnh Thọ", "Phường Vĩnh Trường", "Phường Xương Huân"],
  },
  "Quảng Ninh": {
    "TP. Hạ Long": ["Phường Bạch Đằng", "Phường Bãi Cháy", "Phường Cao Thắng", "Phường Cao Xanh", "Phường Đại Yên", "Phường Giếng Đáy", "Phường Hà Khánh", "Phường Hà Khẩu", "Phường Hà Lầm", "Phường Hà Phong", "Phường Hà Trung", "Phường Hà Tu", "Phường Hoành Bồ", "Phường Hồng Gai", "Phường Hồng Hà", "Phường Hồng Hải", "Phường Hùng Thắng", "Phường Tuần Châu", "Phường Việt Hưng", "Phường Yết Kiêu"],
  },
};

export const PROVINCE_NAMES = Object.keys(VIETNAM_LOCATIONS);

export function getDistrictsByProvince(provinceName: string): string[] {
  const prov = VIETNAM_LOCATIONS[provinceName];
  if (!prov) return ["Quận / Huyện trung tâm"];
  return Object.keys(prov);
}

export function getWardsByDistrict(provinceName: string, districtName: string): string[] {
  const prov = VIETNAM_LOCATIONS[provinceName];
  if (!prov) return ["Phường / Xã trung tâm"];
  const wards = prov[districtName];
  if (!wards || wards.length === 0) return ["Phường / Xã trung tâm"];
  return wards;
}
