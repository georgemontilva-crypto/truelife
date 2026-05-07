import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gray-900 text-white py-14 px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Have a question or need help with your order? We'd love to hear from you.
          </p>
        </div>

        <div className="container max-w-5xl mx-auto py-14 px-4 grid md:grid-cols-5 gap-10">
          {/* Form */}
          <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h2>
                <p className="text-gray-500 text-sm max-w-xs">
                  Thanks for reaching out. We'll get back to you within 1–2 business days.
                </p>
                <Button
                  className="mt-6 bg-gray-900 hover:bg-black text-white"
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Send us a message</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="Your name" value={form.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" placeholder="How can we help?" value={form.subject} onChange={handleChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us more..."
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    required
                    className="resize-none"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 bg-gray-900 hover:bg-black text-white">
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Email</p>
                    <p className="text-sm font-medium text-gray-900">support@chronicherb.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                    <p className="text-sm font-medium text-gray-900">+1 (800) 420-4200</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Location</p>
                    <p className="text-sm font-medium text-gray-900">Denver, Colorado</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-1">Business Hours</h3>
              <p className="text-gray-400 text-sm mb-3">We typically respond within 24 hours.</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Mon – Fri</span>
                  <span>9am – 6pm MST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Saturday</span>
                  <span>10am – 4pm MST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sunday</span>
                  <span className="text-gray-400">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
