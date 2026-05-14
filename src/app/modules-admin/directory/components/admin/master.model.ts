export interface DepartmentPayload {
  nameTh: string;
  nameEn: string;
  description: string;
}

export interface PositionPayload {
  nameTh: string;
  nameEn: string;
  description: string;
  departmentId: number;
}

export interface MasterPayload {
  nameTh: string;
  nameEn: string;
  description: string;
}
