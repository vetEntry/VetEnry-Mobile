# VetEntry AI - Mobile App

A comprehensive React Native mobile application for veterinary and farm management, designed to help farmers, farm workers, and veterinarians manage their operations efficiently.

## Features

### For Farmers
- **Dashboard**: Overview of farms, flocks, financial data, and worker activity
- **Farm & Flock Management**: Create and manage farms, flocks, and breeds
- **Health Monitoring**: Health alerts and veterinary consultations
- **Task Management**: Assign and track farm tasks
- **Financial Tracking**: Revenue, expenses, and profit analysis
- **Worker Management**: Manage farm workers and their activities
- **Marketplace**: Buy and sell farm products and equipment

### For Farm Workers
- **Dashboard**: Task overview and flock status
- **Data Entry**: Record feed, health, weight, and production data
- **Offline Support**: Work without internet connection with data sync
- **Task Management**: View and complete assigned tasks
- **Reports**: Generate and view farm reports

### For Veterinarians
- **Dashboard**: Consultation overview and health alerts
- **Consultations**: Manage veterinary consultations
- **Health Alerts**: Monitor and respond to health issues
- **Flock Monitoring**: Track flock health and provide recommendations

## Technology Stack

- **Frontend**: React Native with TypeScript
- **Navigation**: React Navigation 6
- **UI Components**: React Native Paper
- **State Management**: React Hooks (useState, useEffect)
- **API Client**: Axios
- **Offline Storage**: AsyncStorage
- **Icons**: React Native Vector Icons
- **Backend**: Express.js with Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication

## Project Structure

```
├── App.tsx                          # Main app entry point
├── src/
│   ├── screens/                     # Screen components
│   │   ├── auth/                    # Authentication screens
│   │   ├── farmer/                  # Farmer-specific screens
│   │   ├── worker/                  # Worker-specific screens
│   │   ├── vet/                     # Veterinarian screens
│   │   └── common/                  # Shared screens
│   ├── components/                  # Reusable components
│   │   └── worker/                  # Worker-specific components
│   └── services/                    # API services
│       └── api.ts                   # API client configuration
├── server/                          # Backend server
│   ├── src/
│   │   ├── routes/                  # API routes
│   │   ├── middleware/              # Express middleware
│   │   └── scripts/                 # Database scripts
│   └── prisma/                      # Database schema
├── public/                          # Static assets (images)
└── prisma/                          # Database migrations
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vetEntryAi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the backend server**
   ```bash
   cd server
   npm install
   cp env.example .env
   # Configure your database and other environment variables in .env
   ```

4. **Set up the database**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   npm run seed  # Optional: seed with sample data
   ```

5. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```

6. **Start the React Native app**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

## API Configuration

The mobile app connects to the backend server. Update the API base URL in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3000/api'; // Development
// const API_BASE_URL = 'https://your-production-api.com/api'; // Production
```

## Offline Support

The app includes offline capabilities for farm workers:
- Data entry works without internet connection
- Data is stored locally and synced when online
- Network status monitoring
- Automatic retry mechanisms

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building for Production

#### Android
```bash
cd android
./gradlew assembleRelease
```

#### iOS
```bash
cd ios
xcodebuild -workspace VetEntryAI.xcworkspace -scheme VetEntryAI -configuration Release
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.# VetEnry-Mobile
# VetEnry-Mobile
