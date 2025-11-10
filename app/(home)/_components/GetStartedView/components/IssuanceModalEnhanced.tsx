"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Confetti } from "@/components/ui/confetti"
import { ProgressSteps } from "@/components/ui/progress-steps"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { env } from "@/lib/env"
import { useAirkit } from "@/lib/hooks/useAirkit"
import { useSession } from "@/lib/hooks/useSession"
import { formatKey, getNameFromAccessToken } from "@/lib/utils"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import {
  CheckCircle2,
  HelpCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { useUserData } from "../hooks"

const STEPS = [
  { id: 1, title: "Connect", description: "Link your wallet" },
  { id: 2, title: "Verify", description: "Confirm your data" },
  { id: 3, title: "Issue", description: "Store credentials" },
  { id: 4, title: "Complete", description: "All done!" },
]

export function IssuanceModalEnhanced() {
  const { airService, isInitialized, initError } = useAirkit()
  const { openConnectModal } = useConnectModal()
  const { isConnected } = useAccount()
  const { data: userData, isError, refetch, isLoading: isLoadingUserData } = useUserData()
  const { accessToken, setAccessToken } = useSession()
  const [isWidgetLoading, setIsWidgetLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  let name = getNameFromAccessToken(accessToken)
  const isWalletLogin = env.NEXT_PUBLIC_AUTH_METHOD === "wallet"
  const isAirKitLogin = env.NEXT_PUBLIC_AUTH_METHOD === "airkit"

  // Debug logging
  useEffect(() => {
    console.log("IssuanceModalEnhanced state:", {
      isInitialized,
      initError: initError?.message,
      isComponentLoading: isWidgetLoading || !isInitialized,
      currentStep,
      isConnected,
      hasAccessToken: !!accessToken,
    })
  }, [isInitialized, initError, isWidgetLoading, currentStep, isConnected, accessToken])

  const issueCredential = async ({
    response,
    jwt,
  }: {
    response: Record<string, object | string | number | null>
    jwt: string
  }) => {
    setIsWidgetLoading(true)
    setCurrentStep(3)
    try {
      const credentialSubject = { ...response }
      for (const key in credentialSubject) {
        if (credentialSubject[key] == null) {
          delete credentialSubject[key]
        }
      }

      // CRITICAL: Ensure credential iframe is initialized before calling issueCredential
      console.log("Ensuring credential iframe is ready...")

      // Guard check: Verify SDK is actually initialized
      if (!airService.isInitialized) {
        throw new Error("AIRKit SDK is not initialized. Please refresh the page and try again.");
      }

      await airService.preloadCredential()
      console.log("Credential iframe ready, issuing credential...")
      console.log("JWT token (first 20 chars):", jwt.substring(0, 20) + "...")
      console.log("Credential subject:", credentialSubject)

      await airService.issueCredential({
        authToken: jwt,
        credentialId: env.NEXT_PUBLIC_ISSUE_PROGRAM_ID,
        credentialSubject,
        issuerDid: env.NEXT_PUBLIC_ISSUER_DID,
      })
      console.log("Credential issued successfully!")
      setIsSuccess(true)
      setCurrentStep(4)
    } catch (error) {
      console.error("Failed to issue credential:", error)
      throw error // Re-throw to be caught by handleIssueCredential
    } finally {
      setIsWidgetLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      if (isWalletLogin) {
        if (!accessToken || !isConnected) {
          openConnectModal?.()
          return
        }
        // User is already authenticated via wallet, proceed to step 2
        setCurrentStep(2)
        return // Skip AIRKit login flow for wallet authentication
      }

      setCurrentStep(2)

      while (!airService.isLoggedIn) {
        await airService.login()
      }

      if (isAirKitLogin && !accessToken) {
        try {
          const airkitToken = await airService.getAccessToken()
          const name = (await airService.getUserInfo())?.user?.email

          const verifyRes = await fetch("/api/auth/airkit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${airkitToken.token}`,
            },
            body: JSON.stringify({ name }),
          })

          const data = (await verifyRes.json()) as {
            accessToken: string
            walletAddress: string
          }

          if (!data.accessToken) {
            throw new Error("Invalid login")
          }
          setAccessToken(data.accessToken)
          await refetch()
        } catch (error) {
          console.error(error)
          throw error
        }
      }

      name = getNameFromAccessToken(accessToken)
    } catch (error) {
      console.error(error)
      setCurrentStep(1)
    }
  }

  const handleIssueCredential = async () => {
    try {
      setErrorMessage(null) // Clear previous errors

      if (!userData) {
        throw new Error("No user data")
      }

      const { response, jwt } = userData

      console.log("Issuing credential with JWT token")
      // Directly issue credential with JWT - no AIRKit login needed for wallet auth
      await issueCredential({
        response: response as Record<string, string | number | object | null>,
        jwt,
      })
    } catch (error) {
      console.error("Failed to issue credential:", error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred"
      setErrorMessage(errorMsg)
      // Reset to verify step and show error
      setIsWidgetLoading(false)
      setCurrentStep(2)
    }
  }

  const isComponentLoading = isWidgetLoading || !isInitialized
  const response = userData?.response

  // Update step based on connection status using useEffect would be better,
  // but for now we'll handle it in the button click handlers

  // Success State
  if (isSuccess) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
        <Confetti trigger={isSuccess} />

        <ProgressSteps steps={STEPS} currentStep={currentStep} />

        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl">Congratulations!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your credentials have been securely stored on the Moca Network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>What happens next?</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground ml-7">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Your credentials are now stored securely on the blockchain
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    You can verify your credentials anytime through your wallet
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Share your verified credentials with trusted partners
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => {
                  setIsSuccess(false)
                  setCurrentStep(1)
                }}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Issue Another Credential
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            Secure Credential Issuance
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {env.NEXT_PUBLIC_HEADLINE}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Issue verifiable credentials to the blockchain in just a few simple
            steps. Your data remains secure and under your control.
          </p>
        </div>

        {/* Progress Steps */}
        <ProgressSteps steps={STEPS} currentStep={currentStep} />

        {/* Main Content Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {currentStep === 1 && "Connect Your Wallet"}
                  {currentStep === 2 && "Review Your Data"}
                  {currentStep === 3 && "Issuing Credentials"}
                </CardTitle>
                <CardDescription className="mt-2">
                  {currentStep === 1 &&
                    "Connect your wallet to get started with credential issuance"}
                  {currentStep === 2 &&
                    "Review the information that will be stored in your credential"}
                  {currentStep === 3 &&
                    "Please wait while we securely store your credentials"}
                </CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    {currentStep === 1 &&
                      "Connect your wallet to authenticate and begin the credential issuance process."}
                    {currentStep === 2 &&
                      "Verify that all information is correct before proceeding. This data will be stored on the blockchain."}
                    {currentStep === 3 &&
                      "Your credentials are being securely issued to the Moca Network blockchain."}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Connect */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {initError ? (
                  <div className="space-y-6">
                    <div className="rounded-lg border-2 border-destructive/50 bg-destructive/10 p-6 text-center space-y-4">
                      <p className="text-destructive font-medium">
                        AIR Kit initialization failed
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {initError.message || "An error occurred during initialization"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        You can still try to connect your wallet - the connection may work despite this error.
                      </p>
                      <Button onClick={() => window.location.reload()} variant="outline">
                        Reload Page
                      </Button>
                    </div>
                    <div className="flex flex-col items-center justify-center py-4 space-y-4">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="w-10 h-10 text-primary" />
                      </div>
                      <p className="text-center text-muted-foreground max-w-md">
                        Try connecting your wallet anyway
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleConnect}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      {isWalletLogin ? "Connect Wallet" : "Continue"}
                    </Button>
                  </div>
                ) : !isInitialized ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Wallet className="w-10 h-10 text-primary" />
                      </div>
                      <p className="text-center text-muted-foreground max-w-md">
                        {isWalletLogin
                          ? "Connect your wallet to authenticate and begin the credential issuance process"
                          : "Continue with AIR Kit to authenticate and begin"}
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleConnect}
                      disabled={isComponentLoading}
                    >
                      {isComponentLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Initializing...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          {isWalletLogin ? "Connect Wallet" : "Continue"}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Verify Data */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {errorMessage && (
                  <div className="rounded-lg border-2 border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-destructive font-medium text-sm mb-1">
                      Credential Issuance Failed
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {errorMessage}
                    </p>
                  </div>
                )}
                {isError ? (
                  <div className="rounded-lg border-2 border-destructive/50 bg-destructive/10 p-6 text-center space-y-4">
                    <p className="text-destructive font-medium">
                      Failed to load user data
                    </p>
                    <p className="text-sm text-muted-foreground">
                      There was an issue retrieving your information. Please try
                      again.
                    </p>
                    <Button onClick={() => refetch()} variant="destructive">
                      Retry
                    </Button>
                  </div>
                ) : isLoadingUserData ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <>
                    {name && (
                      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                        <p className="text-sm text-muted-foreground">
                          Welcome back
                        </p>
                        <p className="text-lg font-semibold">{name}</p>
                      </div>
                    )}

                    {response && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          Credential Information
                        </p>
                        <div className="grid gap-3">
                          {Object.entries(response).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border"
                            >
                              <span className="text-sm font-medium">
                                {formatKey(key)}
                              </span>
                              <span className="text-sm text-muted-foreground font-mono">
                                {value ?? "N/A"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setCurrentStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        size="lg"
                        onClick={handleIssueCredential}
                        disabled={!response}
                      >
                        Issue Credential
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Issuing (Loading) */}
            {currentStep === 3 && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <div className="text-center space-y-2">
                  <p className="font-medium text-lg">
                    Issuing your credentials...
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    This may take a moment. Please don&apos;t close this window.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Your credentials are encrypted and stored securely on the blockchain
          </p>
        </div>
      </div>
    </TooltipProvider>
  )
}
