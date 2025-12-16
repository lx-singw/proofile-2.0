/**
 * Unit Tests: Paywall Logic
 * Tests the SignUpModal component's conditional rendering based on trigger action
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignUpModal from '@/components/auth/SignUpModal';

// Mock next/link
jest.mock('next/link', () => {
    const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    );
    MockLink.displayName = 'MockLink';
    return MockLink;
});

describe('SignUpModal - Paywall Logic', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        mockOnClose.mockClear();
    });

    describe('Rendering States', () => {
        it('should not render when isOpen is false', () => {
            render(
                <SignUpModal
                    isOpen={false}
                    onClose={mockOnClose}
                    triggerAction="save"
                />
            );

            expect(screen.queryByText(/Your Professional Resume is Ready/i)).not.toBeInTheDocument();
        });

        it('should render when isOpen is true', () => {
            render(
                <SignUpModal
                    isOpen={true}
                    onClose={mockOnClose}
                    triggerAction="save"
                />
            );

            expect(screen.getByText(/Your Professional Resume is Ready/i)).toBeInTheDocument();
        });
    });

    describe('Trigger Action: Save/Download', () => {
        beforeEach(() => {
            render(
                <SignUpModal
                    isOpen={true}
                    onClose={mockOnClose}
                    triggerAction="save"
                />
            );
        });

        it('should display resume ready message', () => {
            expect(screen.getByText(/Your Professional Resume is Ready/i)).toBeInTheDocument();
        });

        it('should display Proofile benefits', () => {
            expect(screen.getByText(/Shareable link/i)).toBeInTheDocument();
            expect(screen.getByText(/Verified credentials/i)).toBeInTheDocument();
            expect(screen.getByText(/Auto-match with jobs/i)).toBeInTheDocument();
            expect(screen.getByText(/Get rated by colleagues/i)).toBeInTheDocument();
        });

        it('should display correct CTA', () => {
            expect(screen.getByText(/Create Your Proofile - It's Free/i)).toBeInTheDocument();
        });

        it('should have link to register page', () => {
            const ctaLink = screen.getByRole('link', { name: /Create Your Proofile/i });
            expect(ctaLink).toHaveAttribute('href', '/register');
        });
    });

    describe('Trigger Action: Apply Improvements', () => {
        it('should display score when provided', () => {
            render(
                <SignUpModal
                    isOpen={true}
                    onClose={mockOnClose}
                    triggerAction="apply_improvements"
                    score={72}
                />
            );

            expect(screen.getByText(/Your Resume Score: 72\/100/i)).toBeInTheDocument();
        });

        it('should display AI enhancement benefits', () => {
            render(
                <SignUpModal
                    isOpen={true}
                    onClose={mockOnClose}
                    triggerAction="apply_improvements"
                />
            );

            expect(screen.getByText(/AI-enhanced resume/i)).toBeInTheDocument();
            expect(screen.getByText(/Living Proofile with your data/i)).toBeInTheDocument();
        });

        it('should display correct CTA for improvements', () => {
            render(
                <SignUpModal
                    isOpen={true}
                    onClose={mockOnClose}
                    triggerAction="apply_improvements"
                />
            );

            expect(screen.getByText(/Sign Up Free - Save Your Progress/i)).toBeInTheDocument();
        });
    });

    describe('Trigger Action: AI Builder', () => {
        beforeEach(() => {
            render(
                <SignUpModal
                    isOpen={true}
                    onClose={mockOnClose}
                    triggerAction="ai"
                />
            );
        });

        it('should display AI builder message', () => {
            expect(screen.getByText(/AI Resume Builder/i)).toBeInTheDocument();
        });

        it('should display AI benefits', () => {
            expect(screen.getByText(/AI analyzes your professional data/i)).toBeInTheDocument();
            expect(screen.getByText(/Generates optimized resume instantly/i)).toBeInTheDocument();
        });

        it('should display correct CTA for AI', () => {
            expect(screen.getByText(/Create Free Proofile to Use AI Builder/i)).toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        it('should call onClose when close button clicked', () => {
            render(
                <SignUpModal
                    isOpen={true}
                    onClose={mockOnClose}
                    triggerAction="save"
                />
            );

            const closeButton = screen.getByRole('button');
            fireEvent.click(closeButton);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should have sign in link for existing users', () => {
            render(
                <SignUpModal
                    isOpen={true}
                    onClose={mockOnClose}
                    triggerAction="save"
                />
            );

            const signInLink = screen.getByRole('link', { name: /Already have an account/i });
            expect(signInLink).toHaveAttribute('href', '/login');
        });
    });
});
