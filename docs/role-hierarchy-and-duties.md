# Role Hierarchy and Duties Documentation



This document outlines the role hierarchy and specific duties for each role in the VetEntryAI platform. The system implements a hierarchical role-based access control (RBAC) system to ensure proper delegation of duties and data access.

## Role Hierarchy

```
SUPER_ADMIN (System Owner)
    ↓
ADMIN (Platform Administrator)
    ↓
MANAGER (Multi-Farm Manager) ← FARMER (Farm Owner) ← VETERINARIAN (Health Services)
    ↓
SUPERVISOR (Farm Operations)
    ↓
FARM_WORKER (Daily Tasks)
```

## Detailed Role Descriptions

### 1. SUPER_ADMIN (System Owner)
**Level**: System-wide administrator
**Reports to**: No one (top level)
**Manages**: All roles and system operations

#### Key Duties:
- **System Management**
  - Configure platform settings and features
  - Manage system-wide announcements
  - Monitor system health and performance
  - Access system logs and analytics

- **User Management**
  - Create and manage all user accounts
  - Assign and modify user roles
  - Manage user subscriptions and payments
  - Handle system-wide user issues

- **Data Management**
  - Access and export all system data
  - Manage breed standards and disease mappings
  - Oversee data backup and recovery
  - Monitor data integrity

- **Financial Management**
  - Manage subscription plans and pricing
  - Monitor payment processing
  - Handle refunds and billing issues
  - Generate financial reports

#### Permissions:
- Full system access
- Can manage all users and roles
- Access to all data and analytics
- System configuration control

---

### 2. ADMIN (Platform Administrator)
**Level**: Platform administration
**Reports to**: SUPER_ADMIN
**Manages**: Platform users, content, and operations

#### Key Duties:
- **Platform Administration**
  - Manage user accounts and roles
  - Handle support tickets and user issues
  - Create and manage announcements
  - Monitor platform usage and analytics

- **Content Management**
  - Manage breed information and standards
  - Update disease mappings and health data
  - Verify veterinarian and farmer accounts
  - Manage marketplace content

- **User Support**
  - Provide technical support
  - Handle account verification requests
  - Manage user disputes and issues
  - Coordinate with SUPER_ADMIN for system issues

#### Permissions:
- Platform user management
- Content and announcement management
- Support ticket handling
- Analytics and reporting access

---

### 3. MANAGER (Multi-Farm Manager)
**Level**: Farm management
**Reports to**: ADMIN
**Manages**: Multiple farms, supervisors, and farm workers

#### Key Duties:
- **Multi-Farm Management**
  - Oversee operations across multiple farms
  - Coordinate between different farm locations
  - Standardize processes across farms
  - Manage farm budgets and resources

- **Personnel Management**
  - Hire and manage supervisors
  - Assign supervisors to specific farms
  - Review supervisor performance
  - Handle personnel issues and conflicts

- **Strategic Planning**
  - Develop farm expansion strategies
  - Plan production schedules
  - Manage farm equipment and resources
  - Coordinate with veterinarians and suppliers

- **Financial Oversight**
  - Review farm financial reports
  - Approve major purchases
  - Monitor farm profitability
  - Manage farm budgets

#### Permissions:
- Multi-farm data access
- Supervisor and worker management
- Financial and production reports
- Farm equipment and resource management

---

### 4. SUPERVISOR (Farm Supervisor)
**Level**: Farm operations
**Reports to**: MANAGER or FARMER
**Manages**: Farm workers and daily operations

#### Key Duties:
- **Daily Operations Management**
  - Supervise daily farm activities
  - Ensure proper feeding and care procedures
  - Monitor flock health and conditions
  - Coordinate with veterinarians when needed

- **Worker Management**
  - Assign daily tasks to farm workers
  - Train new workers on procedures
  - Monitor worker performance
  - Handle worker scheduling and leave requests

- **Quality Control**
  - Review data entries for accuracy
  - Ensure proper record keeping
  - Monitor production quality
  - Maintain farm safety standards

- **Inventory Management**
  - Track feed and supply inventory
  - Order supplies when needed
  - Monitor equipment maintenance
  - Manage farm resources efficiently

#### Permissions:
- Farm operations data access
- Worker performance monitoring
- Task assignment and management
- Inventory and maintenance tracking

---

### 5. FARM_WORKER (Farm Worker)
**Level**: Daily operations
**Reports to**: SUPERVISOR
**Manages**: Assigned tasks and data recording

#### Key Duties:
- **Daily Farm Tasks**
  - Feed and water livestock
  - Clean and maintain facilities
  - Monitor flock health and behavior
  - Collect eggs and record production

- **Data Recording**
  - Record daily feed consumption
  - Log water consumption
  - Record temperature and humidity
  - Document mortality and health issues
  - Record weight measurements
  - Log egg production data

- **Health Monitoring**
  - Observe flock behavior
  - Report health issues to supervisor
  - Assist with health checks
  - Follow biosecurity protocols

- **Maintenance Tasks**
  - Clean equipment and facilities
  - Perform basic maintenance
  - Report equipment issues
  - Maintain farm cleanliness

#### Permissions:
- Access to assigned flocks
- Data entry capabilities
- Task status updates
- Basic reporting access

---

### 6. FARMER (Farm Owner)
**Level**: Farm ownership
**Reports to**: No direct supervisor (independent)
**Manages**: Own farm operations and workers

#### Key Duties:
- **Farm Ownership**
  - Manage farm business operations
  - Make strategic farm decisions
  - Handle farm finances and budgeting
  - Plan farm expansion and improvements

- **Worker Management**
  - Hire and manage farm workers
  - Set worker responsibilities
  - Handle worker payroll and benefits
  - Resolve worker issues

- **Business Operations**
  - Manage farm finances
  - Handle sales and marketing
  - Coordinate with suppliers
  - Manage farm equipment and resources

- **Health Management**
  - Coordinate with veterinarians
  - Make health-related decisions
  - Manage vaccination schedules
  - Handle disease outbreaks

#### Permissions:
- Own farm data access
- Worker management
- Financial and production reports
- Farm settings and configuration

---

### 7. VETERINARIAN (Health Professional)
**Level**: Health services
**Reports to**: No direct supervisor (independent professional)
**Manages**: Animal health and consultations

#### Key Duties:
- **Health Services**
  - Provide veterinary consultations
  - Diagnose health issues
  - Prescribe treatments and medications
  - Monitor treatment progress

- **Preventive Care**
  - Develop vaccination schedules
  - Provide health advice
  - Conduct health assessments
  - Recommend preventive measures

- **Emergency Care**
  - Handle emergency situations
  - Provide urgent care
  - Coordinate with farmers for emergencies
  - Document emergency treatments

- **Health Records**
  - Maintain detailed health records
  - Document diagnoses and treatments
  - Track patient progress
  - Provide health reports

#### Permissions:
- Health records access
- Consultation management
- Prescription capabilities
- Health analytics access

## Role Assignment Rules

### Who Can Assign Which Roles:

1. **SUPER_ADMIN** can assign all roles
2. **ADMIN** can assign: ADMIN, MANAGER, SUPERVISOR, FARM_WORKER, FARMER, VETERINARIAN
3. **MANAGER** can assign: SUPERVISOR, FARM_WORKER
4. **SUPERVISOR** can assign: FARM_WORKER
5. **FARMER** can assign: FARM_WORKER
6. **FARM_WORKER** cannot assign any roles
7. **VETERINARIAN** cannot assign any roles

### Role Transition Rules:

- Users can have multiple roles but only one active at a time
- Role changes must follow the hierarchy
- Some roles require specific qualifications (e.g., VETERINARIAN requires license verification)
- Role changes are logged for audit purposes

## Data Access Levels

### SUPER_ADMIN
- **Access**: All system data
- **Can**: View, modify, export all data
- **Restrictions**: None

### ADMIN
- **Access**: Platform data, user data, farm data, analytics
- **Can**: View and manage platform-level data
- **Restrictions**: Cannot access individual user personal data

### MANAGER
- **Access**: Assigned farms data, worker data, production data, financial data
- **Can**: View and manage multi-farm operations
- **Restrictions**: Limited to assigned farms

### SUPERVISOR
- **Access**: Farm operations data, worker performance data, daily records
- **Can**: View and manage farm operations
- **Restrictions**: Limited to assigned farm

### FARM_WORKER
- **Access**: Assigned flocks data, own records, task data
- **Can**: View assigned data and record new data
- **Restrictions**: Cannot modify existing data

### FARMER
- **Access**: Own farm data, worker data, production data
- **Can**: View and manage own farm data
- **Restrictions**: Limited to own farm

### VETERINARIAN
- **Access**: Health records, consultation data, patient data
- **Can**: View and manage health-related data
- **Restrictions**: Limited to health data

## Best Practices for Role Management

1. **Principle of Least Privilege**: Assign only the minimum permissions necessary
2. **Regular Review**: Periodically review role assignments and permissions
3. **Documentation**: Keep records of role assignments and changes
4. **Training**: Ensure users understand their role responsibilities
5. **Monitoring**: Monitor role usage and access patterns
6. **Audit Trail**: Maintain logs of all role changes and data access

## Implementation Notes

- All role changes require proper authorization
- Role assignments are logged with timestamps and user information
- Data access is automatically restricted based on role
- Users can switch between their assigned roles
- Role permissions are enforced at both frontend and backend levels 