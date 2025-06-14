import { api, APIError } from "encore.dev/api";

// Define interfaces for our data types
interface Dish {
    id: number;
    name: string;
    image: string;
    description: string;
    price?: number;
}

interface Job {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    description?: string;
    salary?: string;
    requirements?: string[];
}

interface AboutUs {
    title: string;
    content: string;
    image: string;
    features: string[];
}

interface GetHomepageResponse {
    dishes: Dish[];
    jobs: Job[];
    aboutUs: AboutUs;
}

// Get all homepage data
export const getHomepageData = api(
    { method: "GET", path: "/homepage", expose: true },
    async (): Promise<GetHomepageResponse> => {
        return {
            dishes: [
                {
                    id: 1,
                    name: "Paneer Butter Masala",
                    image: "https://images.unsplash.com/photo-1701579231378-3726490a407b?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    description: "Rich and creamy paneer curry with aromatic spices",
                    price: 320
                },
                {
                    id: 2,
                    name: "Dal Rice",
                    image: "https://plus.unsplash.com/premium_photo-1699293238823-7f56fe53ae3e?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    description: "Comfort food combination of lentil curry with steamed rice",
                    price: 180
                },
                {
                    id: 3,
                    name: "Samosas",
                    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop&crop=center",
                    description: "Crispy triangular pastries filled with spiced potatoes",
                    price: 60
                }
            ],
            jobs: [
                {
                    id: 1,
                    title: "Software development engineer",
                    company: "Amazon",
                    location: "Bengaluru",
                    type: "Full time",
                    description: "Develop and maintain scalable web applications using modern technologies",
                    salary: "₹20-35 LPA",
                    requirements: ["JavaScript", "React", "Node.js", "TypeScript"]
                },
                {
                    id: 2,
                    title: "Software development intern",
                    company: "Infosys",
                    location: "Bengaluru",
                    type: "Internship",
                    description: "Work on enterprise software solutions and cloud infrastructure",
                    salary: "₹4-6 LPA",
                    requirements: ["Java", "Spring Boot", "MySQL", "AWS"]
                },
                {
                    id: 3,
                    title: "Software development engineer",
                    company: "Wipro",
                    location: "Bengaluru",
                    type: "Full time",
                    description: "Build scalable web applications and REST APIs",
                    salary: "₹6-12 LPA",
                    requirements: ["Angular", "TypeScript", "REST APIs", "PostgreSQL"]
                }
            ],
            aboutUs: {
                title: "About us",
                content: "Welcome to HR FoodPoint, where culinary excellence meets modern convenience. Born from a passion for delivering exceptional dining experiences, we started as a small cloud kitchen with a big dream - to bring restaurant-quality meals directly to your doorstep. Our journey began when our founder, a seasoned chef with over 15 years of experience in fine dining, recognized the changing landscape of food service. We embraced the cloud kitchen model to focus entirely on what matters most: crafting delicious, fresh meals using premium ingredients and time-honored recipes. From our state-of-the-art kitchen facility, we prepare each dish with meticulous attention to detail, ensuring every order meets our high standards of quality and taste. We believe that great food should be accessible to everyone, which is why we've streamlined our operations to offer exceptional value without compromising on quality.",
                image: "https://plus.unsplash.com/premium_photo-1723823036427-b19e6d270bb6?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                features: [
                    "Premium quality ingredients",
                    "15+ years culinary experience",
                    "State-of-the-art kitchen facility",
                    "Fresh meals delivered daily"
                ]
            }
        };
    }
);

// Get popular dishes only
export const getPopularDishes = api(
    { method: "GET", path: "/homepage/dishes", expose: true },
    async (): Promise<{ dishes: Dish[] }> => {
        const homepageData = await getHomepageData();
        return { dishes: homepageData.dishes };
    }
);

// Get job listings only
export const getJobListings = api(
    { method: "GET", path: "/homepage/jobs", expose: true },
    async (): Promise<{ jobs: Job[] }> => {
        const homepageData = await getHomepageData();
        return { jobs: homepageData.jobs };
    }
);

// Get about us information only
export const getAboutUs = api(
    { method: "GET", path: "/homepage/about", expose: true },
    async (): Promise<{ aboutUs: AboutUs }> => {
        const homepageData = await getHomepageData();
        return { aboutUs: homepageData.aboutUs };
    }
);

// Search dishes by name
interface SearchDishesParams {
    query: string;
}

export const searchDishes = api(
    { method: "GET", path: "/homepage/dishes/search" },
    async (params: SearchDishesParams): Promise<{ dishes: Dish[] }> => {
        const homepageData = await getHomepageData();
        const filteredDishes = homepageData.dishes.filter(dish =>
            dish.name.toLowerCase().includes(params.query.toLowerCase()) ||
            dish.description.toLowerCase().includes(params.query.toLowerCase())
        );
        return { dishes: filteredDishes };
    }
);

// Search jobs by title, company, or location
interface SearchJobsParams {
    query: string;
}

export const searchJobs = api(
    { method: "GET", path: "/homepage/jobs/search" },
    async (params: SearchJobsParams): Promise<{ jobs: Job[] }> => {
        const homepageData = await getHomepageData();
        const filteredJobs = homepageData.jobs.filter(job =>
            job.title.toLowerCase().includes(params.query.toLowerCase()) ||
            job.company.toLowerCase().includes(params.query.toLowerCase()) ||
            job.location.toLowerCase().includes(params.query.toLowerCase())
        );
        return { jobs: filteredJobs };
    }
);

// Get featured content for homepage hero section
interface FeaturedContent {
    title: string;
    subtitle: string;
    buttonText: string;
    backgroundImage?: string;
}

export const getFeaturedContent = api(
    { method: "GET", path: "/homepage/featured", expose: true },
    async (): Promise<{ featured: FeaturedContent }> => {
        return {
            featured: {
                title: "Home Like Food & Job Seeking",
                subtitle: "Find meals and job opportunities in one place.",
                buttonText: "Get Started",
                backgroundImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=600&fit=crop&crop=center"
            }
        };
    }
);