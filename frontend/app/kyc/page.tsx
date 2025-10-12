"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function KYCPage() {
  const [step, setStep] = useState(1)
  const [documentType, setDocumentType] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")

  const handleSubmit = async () => {
    // TODO: Connect to API
    toast.success("KYC documents submitted!", {
      description: "We'll review your documents within 2-5 minutes"
    })
    setStep(3)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Verify Your Identity</h1>
            <p className="text-muted-foreground">
              Quick 2-minute verification to unlock full trading features
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`h-1 w-16 ${step > s ? 'bg-green-600' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          <Card className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Step 1: Choose Document</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a government-issued ID
                  </p>
                </div>

                <div>
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving_license">UK Driving License</SelectItem>
                      <SelectItem value="national_id">National ID Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Document Number</Label>
                  <Input
                    placeholder="Enter document number"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={() => setStep(2)}
                  disabled={!documentType || !documentNumber}
                  className="w-full"
                >
                  Continue to Upload
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Step 2: Upload Documents</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We need clear photos of your {documentType}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Front of Document</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground">or drag and drop</p>
                    </div>
                  </div>

                  {documentType === 'driving_license' && (
                    <div>
                      <Label>Back of Document</Label>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Selfie with Document</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload selfie</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1">
                    Submit for Verification
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Documents Submitted!</h3>
                <p className="text-muted-foreground mb-6">
                  We're reviewing your documents. You'll be verified within 2-5 minutes.
                </p>
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    ✅ Your £10 bonus will be credited once verification is complete
                  </p>
                </div>
                <Button onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard
                </Button>
              </div>
            )}
          </Card>

          {/* Why KYC */}
          <Card className="p-6 mt-6 bg-muted/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Why do we need this?</h4>
                <p className="text-sm text-muted-foreground">
                  UK law requires all crypto platforms to verify user identity (KYC/AML compliance).
                  This protects you and prevents fraud. Your data is encrypted and never shared.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
