# **App Name**: VoltaConnect

## Core Features:

- Secure Authentication & Role Management: Implement Firebase Authentication for user login, redirecting users based on their custom roles: Super Admin, Operator (Station Manager), and End User.
- Multi-Tenant Station Management: Allow Super Admins and Operators to view, create, edit, and delete charging stations, including location details and active/offline status, stored in Firestore.
- Real-time Charger Monitoring & Control: Display real-time status and usage for individual chargers within a station using Firestore listeners. Operators can remotely 'Start/Stop' charging sessions.
- Transaction History & Financial Analytics: Record and display comprehensive charging transactions (duration, cost, energy delivered) for end-users, and provide financial reporting graphs for Super Admins.
- Dynamic Map Display & Station Location: Integrate a mapping service (Mapbox or Google Maps) to visually display all station locations with status-colored pins on a real-time map.
- Role-Specific User Dashboards: Provide tailored user interfaces for each role: Admin (global overview, user management), Operator (assigned stations, controls), and End User (nearby stations, charging history, wallet).
- Smart Charging Station Recommendation Tool: An AI tool for End Users to suggest optimal charging stations based on availability, vehicle compatibility, and current network load, aiming to minimize cost or maximize charging speed.

## Style Guidelines:

- The primary color palette will be 'Deep Charcoal' (#121212) as the background for a sleek, dark-mode optimized interface, complemented by 'Electric Blue' (#3b82f6) for interactive elements and branding, and 'Success Green' (#22c55e) for status indicators and positive actions. This palette reflects a professional, industrial, and high-tech aesthetic, enhancing visibility in a dark theme.
- Body and headline font: 'Inter', a grotesque-style sans-serif for its modern, machined, and objective appearance, suitable for a technical and data-heavy application. This font ensures readability across all dashboards and reports.
- Use 'Lucide React' icons. Their clean lines and modern design align with the professional industrial aesthetic, ensuring clear visual communication of features and actions within the application.
- The application will feature a persistent, collapsible sidebar navigation for core sections like Dashboard, Stations, and Analytics, paired with a responsive top header displaying user roles and notifications, ensuring efficient navigation and critical information at a glance. Visual components such as 'Stat Cards' and 'Real-time Maps' will provide key information density without sacrificing clarity.
- Subtle and purposeful animations, such as smooth transitions for state changes in real-time data updates or navigation, to enhance user experience without distraction, reinforcing the professional and modern feel of the platform.