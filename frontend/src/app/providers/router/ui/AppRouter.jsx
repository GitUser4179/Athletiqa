import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";

import Header from "../../../../widgets/header";
import Footer from "../../../../widgets/footer";
import { MessageModal } from "../../../../features/message-modal";

import { HomePage } from "../../../../pages/home";
import { action as loginAction } from "../../../../pages/auth/ui/LoginPage.action";
import { LoginPage } from "../../../../pages/auth";
import { RegisterPage } from "../../../../pages/auth";
import { ForgotPasswordPage } from "../../../../pages/auth";
import { ResetPasswordPage } from "../../../../pages/auth";
import { AthleteProfilePage } from "../../../../pages/athlete-profile";
import { SponsorProfile } from "../../../../pages/sponsor-profile";
import { ExplorePage } from "../../../../pages/explore";
import { CampaignDetailsPage } from "../../../../pages/campaign-details";
// import CreateCampaignForm from '../../../../features/donate-to-campaign/ui/CampaignForm';
import { StripeSuccess } from "../../../../pages/stripe-success";
import { SettingsPage } from "../../../../pages/settings";
import { DonateSuccess } from "../../../../pages/donate-success";
import { SportsSelectionPage } from "../../../../pages/sports-selection";
import { CreateCampaignForm } from "../../../../features/create-campaign";
import { AuthProvider } from "../../../../shared/lib/AuthProvider";
import { UpdatePostPage } from "../../../../pages/update-post";
import { updatePostAction } from "../../../../features/update-post";
import { updatePostLoader } from "../../../../features/update-post";
import {
  DonationTermsAndCondition,
  UserTermsAndConditions,
  IntegrityPolicy,
} from "../../../../pages/info-pages";
import { AboutUsPage } from "../../../../pages/about-us";
import {
  forgotPasswordAction,
  resetPasswordAction,
} from "../../../../pages/auth/ui/passwordPage.action";
import { VerifyEmailPage } from "../../../../pages/auth";
import { CreatePostPage } from "../../../../pages/create-post";
import { Faq } from "../../../../pages/faq";
import { HelpSection } from "../../../../features/update-settings";
import { NotFoundPage, RouteErrorPage } from "../../../../pages/not-found";

function RootLayout() {
  return (
    <AuthProvider>
      <Header />
      <MessageModal />
      <main>
        <Outlet />
      </main>
      <Footer />
    </AuthProvider>
  );
}

/*
Main Application Router
Defines the mapping between URLs, UI Components, and Data Actions.
*/

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage />, action: loginAction },
      { path: "/register", element: <RegisterPage /> },
      { path: "/athlete-profile", element: <AthleteProfilePage /> },
      { path: "/athlete-profile/:id", element: <AthleteProfilePage /> },
      { path: "/sponsor-profile", element: <SponsorProfile /> },
      { path: "/sponsor-profile/:id", element: <SponsorProfile /> },
      { path: "/explore", element: <ExplorePage /> },
      {
        /* path: '/donate', element: <CreateCampaignForm /> */
      },
      { path: "/stripe-success", element: <StripeSuccess /> },
      { path: "/settings", element: <SettingsPage /> },
      {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
        action: forgotPasswordAction,
      },
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
        action: resetPasswordAction,
      },
      { path: "/campaign/:id", element: <CampaignDetailsPage /> },
      { path: "/donate-success", element: <DonateSuccess /> },
      {
        /* path: '/donate/:campaignId', element: <DonatePage /> */
      },
      { path: "/sports-selection", element: <SportsSelectionPage /> },
      { path: "/stripe-success", element: <StripeSuccess /> },
      {
        path: "/post/:postId/edit",
        element: <UpdatePostPage />,
        action: updatePostAction,
        loader: updatePostLoader,
      },
      { path: "/donationsvillkor", element: <DonationTermsAndCondition /> },
      { path: "/anvandarvillkor", element: <UserTermsAndConditions /> },
      { path: "/integritetspolicy", element: <IntegrityPolicy /> },
      { path: "/about-us", element: <AboutUsPage /> },
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/create-post", element: <CreatePostPage /> },
      { path: "/faq", element: <Faq /> },
      { path: "/help", element: <HelpSection /> },
      // Catch-all: unknown URLs show the 404 page inside the normal layout
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

// add more routes here as we go on with the app :)
// oki, done :3

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
