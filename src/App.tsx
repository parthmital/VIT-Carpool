import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RidesProvider } from "@/contexts/RidesContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import CreateRide from "./pages/CreateRide";
import RideDetail from "./pages/RideDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<AuthProvider>
			<RidesProvider>
				<TooltipProvider>
					<Toaster />
					<Sonner />
					<BrowserRouter>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/login" element={<Login />} />
							<Route path="/create" element={<CreateRide />} />
							<Route path="/ride/:id" element={<RideDetail />} />
							<Route path="*" element={<NotFound />} />
						</Routes>
					</BrowserRouter>
				</TooltipProvider>
			</RidesProvider>
		</AuthProvider>
	</QueryClientProvider>
);

export default App;
