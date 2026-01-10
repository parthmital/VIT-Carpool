# VIT Carpool App

A modern carpooling application designed for the VIT community, built with React, TypeScript, and Supabase. This application allows users to easily find, offer, and manage car rides.

## ✨ Features

- **User Authentication**: Secure login and registration powered by Supabase Auth.
- **Create & Offer Rides**: Users can easily create and post new ride offerings with details like origin, destination, time, and available seats.
- **Search & Join Rides**: Intuitive search functionality to find available rides based on location and time. Users can join existing rides.
- **Manage & Edit Rides**: Users can view, edit, and cancel their offered and joined rides.
- **Location Selection**: Integrated location selection for precise origin and destination points.
- **Responsive Design**: A user-friendly interface that works seamlessly across various devices.
- **WhatsApp Integration**: Prompt to connect with ride participants via WhatsApp.

## 🛠️ Technologies Used

- **Frontend**: React.js, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/UI
- **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime)
- **Package Manager**: Bun

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js (LTS)
- Bun
- Git
- A Supabase account and project

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/vit-carpool.git
    cd vit-carpool
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Set up Supabase Environment Variables:**

    Create a `.env` file in the root of the project with your Supabase project URL and Anon Key:

    ```
    VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

    You can find these values in your Supabase project settings under `API`.

4.  **Run the development server:**

    ```bash
    bun dev
    ```

    The application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

### Database Setup (Supabase)

The `supabase-schema.sql` file contains the SQL schema for your Supabase project. You can import this directly into your Supabase SQL Editor to set up the necessary tables and functions.

1.  Go to your Supabase project dashboard.
2.  Navigate to the `SQL Editor`.
3.  Create a new query and paste the contents of [`supabase-schema.sql`](supabase-schema.sql) into it.
4.  Run the query to create your tables and policies.

## 💡 Usage

1.  **Register/Login**: Create a new account or log in with existing credentials.
2.  **Offer a Ride**: Navigate to the "Create Ride" page to post details about a ride you're offering.
3.  **Find a Ride**: Use the search functionality on the homepage to find available rides.
4.  **Manage Rides**: View and manage your offered and joined rides from the "Manage Rides" and "Joined Rides" sections.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
