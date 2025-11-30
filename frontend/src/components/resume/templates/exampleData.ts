import { ResumeData } from './index';

export const EXAMPLE_RESUME_DATA: ResumeData = {
    personal: {
        name: 'John Davidson',
        title: 'Senior Product Manager',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        address: '123 Innovation Drive',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        linkedin: 'linkedin.com/in/johndoe',
        website: 'johndoe.com',
        summary: 'Accomplished product leader with 8+ years of experience driving product strategy and execution. Proven track record of launching successful products and leading cross-functional teams.'
    },
    experience: [
        {
            company: 'TechCorp Inc.',
            position: 'Senior Product Manager',
            startDate: 'Jan 2020',
            endDate: 'Present',
            description: '• Led a cross-functional team of 15 engineers and designers to launch the company\'s flagship product.\n• Increased user engagement by 45% through data-driven feature optimization.\n• Managed a $2M annual product budget and roadmap.'
        },
        {
            company: 'StartupXYZ',
            position: 'Product Manager',
            startDate: 'Mar 2018',
            endDate: 'Dec 2019',
            description: '• Launched 3 major features that contributed to a 30% increase in ARR.\n• Conducted user research and usability testing to inform product decisions.'
        }
    ],
    education: [
        {
            institution: 'Harvard University',
            degree: 'MBA',
            field: 'Business Administration',
            graduationDate: '2018'
        },
        {
            institution: 'MIT',
            degree: 'BS',
            field: 'Computer Science',
            graduationDate: '2015'
        }
    ],
    skills: ['Product Management', 'Agile/Scrum', 'Data Analysis', 'Python', 'SQL', 'User Research', 'Strategic Planning'],
};
