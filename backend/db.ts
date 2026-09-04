import { 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE, 
  INITIAL_LEAVE_APPLICATIONS, 
  INITIAL_REGULARIZATIONS 
} from '../src/data/initialData';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveApplication, 
  RegularizationRequest 
} from '../src/types';

class BackendDatabase {
  public employees: Employee[];
  public attendance: AttendanceRecord[];
  public leaves: LeaveApplication[];
  public regularizations: RegularizationRequest[];

  constructor() {
    this.employees = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES));
    this.attendance = JSON.parse(JSON.stringify(INITIAL_ATTENDANCE));
    this.leaves = JSON.parse(JSON.stringify(INITIAL_LEAVE_APPLICATIONS));
    this.regularizations = JSON.parse(JSON.stringify(INITIAL_REGULARIZATIONS));
  }

  public reset() {
    this.employees = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES));
    this.attendance = JSON.parse(JSON.stringify(INITIAL_ATTENDANCE));
    this.leaves = JSON.parse(JSON.stringify(INITIAL_LEAVE_APPLICATIONS));
    this.regularizations = JSON.parse(JSON.stringify(INITIAL_REGULARIZATIONS));
  }
}

export const db = new BackendDatabase();
