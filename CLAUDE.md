# Fahman Project - Development Guide

**A multiplayer trivia game with React Native frontend and Bun/Express backend**

---

## 🎯 Project Mission

Build a **production-ready, scalable, and maintainable** multiplayer trivia game application with clean code, reusable components, and full backend integration.

---

## 📋 Core Principles

### 1. **Reusable Components First**
- ✅ **ALWAYS** check `/app/src/components/ui` before creating new UI elements
- ✅ Use existing components: Button, Input, Modal, Card, Avatar, Toast, etc.
- ❌ **NEVER** duplicate UI code or create component variants when reusable ones exist
- ❌ **NEVER** hardcode colors - use `colors` from `@/themes` or NativeWind classes

**Example:**
```typescript
// ✅ GOOD
import { Button, Modal, Input } from "@/components/ui";

// ❌ BAD - Creating custom button when Button component exists
const MyCustomButton = () => <Pressable>...</Pressable>
```

---

### 2. **Backend Integration Only - No Mock Data**
- ✅ **ALWAYS** integrate with backend APIs via service layer
- ✅ Use services from `/app/src/services` (roomsService, friendsService, etc.)
- ❌ **NEVER** use mock data in production code
- ❌ **NEVER** hardcode user data, rooms, messages, or any dynamic content

**Example:**
```typescript
// ✅ GOOD - Backend integration
const { data } = await roomsService.getPublicRooms({ page: 1, limit: 20 });

// ❌ BAD - Mock data
const rooms = MOCK_ROOMS;
```

---

### 3. **Error Handling with Toast Notifications**
- ✅ **ALWAYS** use `useToast()` hook for error messages
- ✅ Show user-friendly error messages via toast
- ✅ Handle all API errors gracefully
- ❌ **NEVER** use console.error for user-facing errors
- ❌ **NEVER** leave errors unhandled

**Example:**
```typescript
// ✅ GOOD
import { useToast } from "@/contexts";

try {
  await roomsService.joinRoomByCode(code);
} catch (error: any) {
  toast.error(error.message || "Failed to join room");
}

// ❌ BAD
try {
  await roomsService.joinRoomByCode(code);
} catch (error) {
  console.error(error); // User never sees this!
}
```

---

### 4. **Functional & Production-Ready**
- ✅ All features must be **fully functional** and connected to backend
- ✅ Code must be **clean, readable, and maintainable**
- ✅ Use TypeScript strictly - no `any` types
- ✅ Components must be **scalable** (split at 500 lines for frontend, 300 for backend)
- ✅ Follow established patterns from existing codebase
- ❌ **NEVER** ship non-functional features
- ❌ **NEVER** leave broken navigation or API calls

---

### 5. **No Placeholders or TODOs**
- ✅ Implement features **completely** before moving on
- ✅ Replace all placeholder text with actual functionality
- ✅ Connect all buttons, modals, and inputs to real logic
- ❌ **NEVER** leave `// TODO:` comments in production code
- ❌ **NEVER** use placeholder text like "Coming soon" or "Feature unavailable"

**Example:**
```typescript
// ❌ BAD
<Button onPress={() => {
  // TODO: Implement this later
  console.log("Not implemented");
}}>

// ✅ GOOD
<Button onPress={handleJoinRoom}>
  Join Room
</Button>
```

---

## 📚 Documentation Structure

This project has detailed documentation for each layer:

### **Frontend Guide** → [app/CLAUDE.md](app/CLAUDE.md)
- Component architecture and reusable UI components
- Navigation patterns (React Navigation with custom animations)
- Styling with NativeWind + custom theme
- Custom hooks (useMessaging, useFriends, usePacks)
- Modal animation best practices
- Screen structure and organization

### **Backend Guide** → [backend/CLAUDE.md](backend/CLAUDE.md)
- RESTful API design and response formatting
- Database schema (Prisma + PostgreSQL)
- Authentication & authorization (JWT, OAuth)
- Service layer pattern
- Real-time features (Socket.io)
- Error handling and validation
- Testing standards
- Security best practices

---

## 🏗️ Project Architecture

### **Frontend** (`/app`)
```
React Native + Expo + TypeScript + NativeWind
├── Reusable UI components (/components/ui)
├── Feature components (rooms, lobby, game, messaging, friends)
├── Screens (15+ main screens)
├── Services (API integration layer)
├── Hooks (state management)
└── Contexts (Auth, Toast)
```

### **Backend** (`/backend`)
```
Bun + Express + TypeScript + Prisma + Socket.io
├── Routes (API endpoints)
├── Controllers (request handlers)
├── Services (business logic)
├── Middlewares (auth, validation, error handling)
├── Socket handlers (real-time events)
└── Database (PostgreSQL with Prisma ORM)
```

---

## ✅ Pre-Implementation Checklist

Before implementing any feature, verify:

- [ ] **Component exists?** Check `/app/src/components/ui` first
- [ ] **Backend endpoint ready?** Check service layer in `/app/src/services`
- [ ] **Error handling?** Use `toast.error()` for all user-facing errors
- [ ] **Type safety?** All props and functions properly typed
- [ ] **No mock data?** All data from backend APIs
- [ ] **Fully functional?** No TODOs, no placeholders, everything works
- [ ] **Code quality?** Clean, readable, follows existing patterns
- [ ] **File size?** Split if over 500 lines (frontend) or 300 lines (backend)

---

## 🚀 Common Patterns

### **Frontend: API Integration**
```typescript
// 1. Import service
import { roomsService } from "@/services/roomsService";
import { useToast } from "@/contexts";

// 2. Make API call with error handling
const toast = useToast();
const [isLoading, setIsLoading] = useState(false);

const fetchRooms = async () => {
  setIsLoading(true);
  try {
    const response = await roomsService.getPublicRooms({ page: 1, limit: 20 });
    if (response.success && response.data) {
      setRooms(response.data.rooms || []);
    }
  } catch (error: any) {
    toast.error(error.message || "Failed to load rooms");
  } finally {
    setIsLoading(false);
  }
};
```

### **Backend: Service Layer**
```typescript
// Service handles business logic
export class RoomService {
  static async createRoom(userId: string, data: CreateRoomData) {
    // Validation
    if (!data.packId) {
      throw new ValidationError("Pack ID is required");
    }

    // Business logic
    const room = await prisma.room.create({
      data: {
        ...data,
        creatorId: userId,
        code: await generateUniqueRoomCode(),
      },
    });

    return room;
  }
}
```

### **Real-time Updates**
```typescript
// Backend: Broadcast after REST operation
const room = await RoomService.updateRoom(roomId, data);
io.to(roomId).emit("room:updated", room);

// Frontend: Listen for updates
useEffect(() => {
  socketService.on("room:updated", (updatedRoom) => {
    setRoom(updatedRoom);
  });
}, []);
```

---

## 🎨 Styling Standards

### **Use Reusable Components**
```typescript
// ✅ GOOD
<Button variant="primary" onPress={handleSubmit}>Submit</Button>
<Input variant="filled" placeholder="Enter code" />
<Modal visible={visible} onClose={onClose} title="Join Room" />

// ❌ BAD - Creating custom styled components
<Pressable style={{ backgroundColor: '#f97316', padding: 12 }}>
  <Text style={{ color: 'white' }}>Submit</Text>
</Pressable>
```

### **Use Theme Colors**
```typescript
// ✅ GOOD
import { colors } from "@/themes";
style={{ backgroundColor: colors.primary[500] }}
className="bg-primary-500 text-white"

// ❌ BAD
style={{ backgroundColor: '#f97316' }} // Hardcoded color
```

---

## 🔒 Security & Best Practices

### **Frontend**
- ✅ Store JWT tokens in secure storage (expo-secure-store)
- ✅ Validate user input before sending to backend
- ✅ Handle authentication errors (401) → redirect to login
- ❌ Never store sensitive data in AsyncStorage

### **Backend**
- ✅ Validate ALL inputs with Joi schemas
- ✅ Hash passwords with bcrypt (never store plain text)
- ✅ Use JWT with short expiry (1-2 hours)
- ✅ Rate limit authentication endpoints
- ❌ Never expose system errors to users
- ❌ Never trust client-provided user IDs

---

## 🧪 Testing Requirements

### **Frontend**
- Test critical user flows (login, join room, send message)
- Test error handling (network errors, invalid inputs)
- Test navigation transitions

### **Backend**
- Unit tests for services (business logic)
- Integration tests for complete workflows
- Test authentication & authorization
- Test socket event handlers

---

## 📖 Key Files Reference

### **Frontend**
- **UI Components**: `/app/src/components/ui/index.ts`
- **Services**: `/app/src/services/*.ts`
- **Hooks**: `/app/src/hooks/*.ts`
- **Theme Colors**: `/app/src/themes/colors.ts`
- **Navigation**: `/app/App.tsx`

### **Backend**
- **Routes**: `/backend/src/routes/*.ts`
- **Services**: `/backend/src/services/*.ts`
- **Database Schema**: `/backend/prisma/schema.prisma`
- **Error Classes**: `/backend/src/utils/errors.ts`
- **Socket Handlers**: `/backend/src/socket/handlers/*.ts`

---

## ⚠️ Common Mistakes to Avoid

### **Frontend**
- ❌ Creating custom UI components when reusable ones exist
- ❌ Using mock data instead of backend APIs
- ❌ Not showing error messages to users
- ❌ Hardcoding colors instead of using theme
- ❌ Leaving console.log statements in production code

### **Backend**
- ❌ Putting business logic in controllers (use services)
- ❌ Not validating inputs
- ❌ Catching errors without re-throwing or handling
- ❌ Not broadcasting socket events after REST operations
- ❌ Using `any` type in TypeScript

---

## 🎯 Remember

When implementing ANY feature:

1. **Check for reusable components first**
2. **Connect to backend API** (no mock data)
3. **Add error handling with toast**
4. **Make it fully functional** (no placeholders)
5. **Follow existing patterns** in the codebase
6. **Keep code clean and scalable**
7. **Test the complete user flow**

---

## 📚 Learn More

- **Frontend Details**: See [app/CLAUDE.md](app/CLAUDE.md)
- **Backend Details**: See [backend/CLAUDE.md](backend/CLAUDE.md)
- **API Documentation**: `http://localhost:3000/api-docs` (Swagger)
- **Database Schema**: `/backend/prisma/schema.prisma`

---

**Built with ❤️ for clean, production-ready code**
