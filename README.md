# ClutchMetrics Web

**ClutchMetrics** is a web and mobile platform focused on competitive gaming analytics, video content management, and community interaction.

The web application allows players to explore match statistics, monitor performance, manage gaming accounts, create and publish highlights, participate in challenges, and interact with other members of the gaming community.

It is developed with **Next.js, React, TypeScript, and Tailwind CSS**, and communicates with a shared **Java Spring Boot REST API** backed by **PostgreSQL**.

## Technologies

- Next.js 16.4.3
- React 19.3
- TypeScript 5
- Tailwind CSS 4
- Lucide React
- React Icons
- REST API integration

**Backend:** Java Spring Boot, Spring Security, Spring Data JPA  
**Database:** PostgreSQL  
**Email testing:** Mailpit  
**Video processing:** FFmpeg, through the backend

## Main Features

### Authentication and Account Security

- User registration with email verification
- Login and logout
- JWT authentication with access and refresh tokens
- Forgot password and password reset
- Password changes with email confirmation
- Protected pages and role-based access control
- User and administrator roles

### Dashboard

- Overview of player performance
- Match summaries and recent activity
- Game-specific performance information
- Statistics and performance indicators
- Premium subscription information

### Matches and Analytics

- View match history
- Filter matches by game and result
- Competitive and Casual match categories
- Kills, deaths, assists, and KDA statistics
- Performance charts and historical trends
- Game-specific analytics
- Premium-restricted All Time analytics

Match records currently use demonstration data rather than automatic synchronization with official gaming platforms.

### Game Accounts

- Connect and disconnect gaming accounts
- Select the game, region, and platform
- View connected accounts
- Reconnect previously disconnected accounts
- Manage one connected account per supported game

These connections are currently managed within ClutchMetrics and do not provide full integration with official game provider APIs.

### Creator Studio

The Creator Studio provides tools for managing gaming videos and highlights.

**My Videos**
- Upload and manage video files
- Add supported video sources through URLs
- Preview and process uploaded videos
- Create clips from existing videos
- Delete uploaded content

**My Clips**
- Manage created clips
- Preview and download clips
- Prepare clips for publication
- Publish highlights to the community Feed

**Video Editor**
- Select video segments using start and end times
- Keep the original video when trimming is unnecessary
- Process videos through the backend
- Export videos in vertical format
- Free plan: 720p export
- Premium plan: 1080p export

Video processing is performed by the Spring Boot backend using FFmpeg.

### Community Feed

- Browse published gaming highlights
- Watch community videos
- Like and unlike clips
- Add and manage comments
- Share highlight links
- Report inappropriate content
- Manage personal published content

### Discover Players

- Discover registered players
- View public player profiles
- Follow and unfollow other users
- View followers and following lists
- Access linked social media profiles
- Explore published player highlights

### Challenges

- Browse available gaming challenges
- View challenge objectives and rewards
- Join challenges
- Track participation and completion status
- Explore challenges associated with supported games
- Support for sponsor information in challenge records

### Premium Subscriptions

- Compare Free and Premium plans
- View the current subscription
- Upgrade or downgrade for demonstration purposes
- Restrict selected advanced features according to subscription level

Premium functionality currently includes All Time analytics and 1080p video exports.

Subscription changes are simulated. Real payment processing is not implemented.

### Profile and Account Management

- View and update public profile information
- Manage display name and biography
- Upload or remove profile pictures
- Manage social media links
- Change account password
- Access account security features

### Administration

The administrator area provides management and moderation functionality, including:

- User administration
- Review of reported clips
- Content moderation actions
- Audit log consultation
- Monitoring of recorded user operations

Audit logs record supported operations performed through the shared backend, including actions originating from the mobile application.

### Support Chatbot

The web application includes a support chatbot designed to help users navigate common ClutchMetrics features and account operations.

It provides predefined, rule-based assistance for supported questions.

The current implementation is not a generative AI chatbot.

## Supported Games

- League of Legends
- Valorant
- Counter-Strike 2

## Getting Started

### Prerequisites

- Node.js and npm
- ClutchMetrics Spring Boot backend
- PostgreSQL database configured for the backend
- FFmpeg installed and accessible to the backend for video processing

### Installation

Clone the web repository:

```bash
git clone https://github.com/AndreMiguelAlves/clutchmetrics-web.git
cd clutchmetrics-web
```

Install dependencies:

```bash
npm install
```

### Backend Configuration

The web application currently communicates with the local Spring Boot REST API:

```text
http://localhost:8080
```

The backend must be running and connected to PostgreSQL before using features that require authentication or application data.

Some features also require Mailpit for email testing and FFmpeg for video processing.

### Running the Application

Start the development server:

```bash
npm run dev
```

The configured development script runs Next.js using Webpack.

Open the application at:

```text
http://localhost:3000
```

### Additional Commands

Create a production build:

```bash
npm run build
```

Run the production server after a successful build:

```bash
npm run start
```

Run ESLint:

```bash
npm run lint
```

## Project Architecture

ClutchMetrics uses a shared backend architecture:

```text
ClutchMetrics Web (Next.js)
              |
              |
ClutchMetrics Mobile (React Native)
              |
              v
       Spring Boot REST API
              |
              v
          PostgreSQL
```

The backend provides authentication, authorization, business logic, data access, content management, and auditing.

Both frontend applications communicate with the same API and share the underlying database.

## Current Limitations and Future Improvements

The current version includes demonstration-focused features and has some known limitations:

- Real gaming account integration with Riot Games and other official game APIs is not implemented
- Match history includes fictional demonstration data
- Automatic gameplay detection and fully automated highlight extraction are not implemented
- 4K video export is not implemented
- Automatic watermark management and removal are not implemented
- Automatic thumbnail generation requires further development
- Subscription payments and automatic billing are not implemented
- Subscription renewal and expiration management require further development
- Direct video publishing to TikTok, Instagram, and YouTube Shorts is not implemented
- The support chatbot uses predefined responses rather than an advanced AI model
- Additional production deployment, performance, and security hardening would be required before public release

These limitations are documented as potential areas for future development.

## Project Context

ClutchMetrics was developed as a final academic project for the **Técnico/a Especialista em Tecnologias e Programação de Sistemas de Informação (TPSI)** course.

The project combines three components:

- **Backend:** Java Spring Boot
- **Web:** Next.js
- **Mobile:** React Native and Expo

The main objective is to combine competitive gaming analytics, video editing workflows, and social interaction within a connected platform.

## Author

André Miguel Nunes Alves

**ClutchMetrics — Your Game. Your Data. Your Edge.**