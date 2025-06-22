import { api } from "encore.dev/api";
import log from "encore.dev/log";

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  timestamp: string;
  userAgent: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  id?: string;
}

export interface ContactInfo {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: {
    main: string;
    tollFree: string;
    fax: string;
  };
  email: {
    general: string;
    support: string;
    business: string;
  };
  businessHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
}

// Submit contact form
export const submit = api(
  { method: "POST", expose: true, path: "/api/contact/submit" },
  async (data: ContactFormData): Promise<ContactResponse> => {
    try {
      // Log the contact form submission
      log.info("Contact form submission received", {
        email: data.email,
        subject: data.subject,
        timestamp: data.timestamp,
        firstName: data.firstName,
        lastName: data.lastName
      });

      // Generate a unique submission ID
      const submissionId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // In a real application, you would:
      // 1. Save to database
      // 2. Send email notification
      // 3. Trigger any necessary workflows

      // For now, we'll just log and return success
      log.info("Contact form processed successfully", {
        submissionId,
        email: data.email
      });

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        message: "Thank you for your message! We'll get back to you soon.",
        id: submissionId
      };

    } catch (error) {
      log.error("Error processing contact form", {
        error: error instanceof Error ? error.message : String(error),
        email: data.email
      });

      throw new Error("Failed to process contact form submission");
    }
  }
);

// Get contact information
export const info = api(
  { method: "GET", expose: true, path: "/api/contact/info" },
  async (): Promise<ContactInfo> => {
    return {
      // House 9, 2nd Floor, Sharadhi Apartments, Nanjappa Layout, Adugodi, Dead End 3rd Cross Road, BTM, Bangalore
      address: {
        street: "123 Food Street",
        city: "Culinary District",
        state: "Foodie City",
        zipCode: "FC 12345"
      },
      phone: {
        main: "+1 (555) 123-4567",
        tollFree: "1-800-FOODIE",
        fax: "+1 (555) 123-4568"
      },
      email: {
        general: "info@hrfoodpoint.com",
        support: "support@hrfoodpoint.com",
        business: "business@hrfoodpoint.com"
      },
      businessHours: {
        weekdays: "Monday - Friday: 9:00 AM - 8:00 PM",
        saturday: "Saturday: 10:00 AM - 6:00 PM",
        sunday: "Sunday: 12:00 PM - 5:00 PM"
      }
    };
  }
);
