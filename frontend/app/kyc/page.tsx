"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Upload, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  FileText,
  Camera,
  User,
  MapPin,
  Calendar
} from "lucide-react"
import { toast } from "sonner"

export default function KYCPage() {
  const [kycLevel, setKycLevel] = React.useState(0)
  const [step, setStep] = React.useState(1)
  const [uploading, setUploading] = React.useState(false)

  const handleDocumentUpload = async (type: string) => {
    setUploading(true)
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000))
    setUploading(false)
    toast.success("Document uploaded successfully")
  }

  const handleSubmitKYC = async () => {
    setUploading(true)
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    setUploading(false)
    setKycLevel(1)
    toast.success("KYC verification submitted", {
      description: "Your documents are being reviewed. This usually takes 1-2 business days."
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Identity Verification</h1>
            <p className="text-muted-foreground">
              Complete your KYC to unlock higher trading limits and withdrawal capabilities
            </p>
          </div>

          {/* Current Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">Verification Status</h2>
                <p className="text-sm text-muted-foreground">
                  Level {kycLevel} - {kycLevel === 0 ? "Not Verified" : kycLevel === 1 ? "Basic Verification" : "Full Verification"}
                </p>
              </div>
              <Badge variant={kycLevel === 0 ? "secondary" : kycLevel === 1 ? "default" : "default"}>
                {kycLevel === 0 ? "Pending" : kycLevel === 1 ? "Under Review" : "Verified"}
              </Badge>
            </div>

            {/* Verification Levels */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-4 border-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    kycLevel >= 0 ? "bg-primary" : "bg-muted"
                  }`}>
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Level 0</p>
                    <p className="text-xs text-muted-foreground">Basic Account</p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• £1,000 daily limit</li>
                  <li>• View markets</li>
                  <li>• Limited trading</li>
                </ul>
              </Card>

              <Card className="p-4 border-2 border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    kycLevel >= 1 ? "bg-primary" : "bg-muted"
                  }`}>
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Level 1</p>
                    <p className="text-xs text-muted-foreground">Verified</p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• £10,000 daily limit</li>
                  <li>• Crypto deposits</li>
                  <li>• Full trading</li>
                </ul>
              </Card>

              <Card className="p-4 border-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    kycLevel >= 2 ? "bg-primary" : "bg-muted"
                  }`}>
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Level 2</p>
                    <p className="text-xs text-muted-foreground">Enhanced</p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• £50,000 daily limit</li>
                  <li>• Fiat deposits/withdrawals</li>
                  <li>• Priority support</li>
                </ul>
              </Card>
            </div>
          </Card>

          {/* KYC Form */}
          {kycLevel === 0 && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Personal Information</h2>
              
              <div className="space-y-6">
                {/* Step 1: Personal Details */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input id="dob" type="date" />
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" placeholder="123 Main Street" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="London" />
                      </div>
                      <div>
                        <Label htmlFor="postcode">Postcode</Label>
                        <Input id="postcode" placeholder="SW1A 1AA" />
                      </div>
                    </div>

                    <Button onClick={() => setStep(2)} className="w-full">
                      Continue to Document Upload
                    </Button>
                  </div>
                )}

                {/* Step 2: Document Upload */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Upload Identification</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Please upload a clear photo of your government-issued ID (Passport, Driver's License, or National ID Card)
                      </p>
                      
                      <Card className="p-6 border-2 border-dashed border-muted-foreground/25 hover:border-primary transition-colors cursor-pointer">
                        <div className="flex flex-col items-center text-center">
                          <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="font-medium mb-1">Click to upload ID document</p>
                          <p className="text-sm text-muted-foreground">PNG, JPG or PDF (max 5MB)</p>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf"
                            onChange={() => handleDocumentUpload('id')}
                          />
                        </div>
                      </Card>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Upload Selfie</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Take a selfie holding your ID document next to your face
                      </p>
                      
                      <Card className="p-6 border-2 border-dashed border-muted-foreground/25 hover:border-primary transition-colors cursor-pointer">
                        <div className="flex flex-col items-center text-center">
                          <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="font-medium mb-1">Click to upload selfie</p>
                          <p className="text-sm text-muted-foreground">PNG or JPG (max 5MB)</p>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            capture="user"
                            onChange={() => handleDocumentUpload('selfie')}
                          />
                        </div>
                      </Card>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button onClick={handleSubmitKYC} disabled={uploading} className="flex-1">
                        {uploading ? "Submitting..." : "Submit for Verification"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Pending Review */}
          {kycLevel === 1 && (
            <Card className="p-8 text-center">
              <div className="inline-flex h-16 w-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Verification In Progress</h2>
              <p className="text-muted-foreground mb-6">
                Your documents have been submitted and are currently being reviewed by our team.
                You'll receive an email once the verification is complete.
              </p>
              <p className="text-sm text-muted-foreground">
                Typical review time: 1-2 business days
              </p>
            </Card>
          )}

          {/* Important Information */}
          <Card className="p-6 bg-muted/50">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Important Information:</p>
                <ul className="space-y-1">
                  <li>• All information must match your government-issued ID</li>
                  <li>• Photos should be clear and all text must be readable</li>
                  <li>• Documents must not be expired</li>
                  <li>• Your data is encrypted and stored securely</li>
                  <li>• Verification typically takes 1-2 business days</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

