import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AnnouncementsPage, { type DashboardStats } from '../AnnouncementsPage'
import { supabase } from '@/DB'

// Mock supabase
vi.mock('@/DB', () => {
    const makeChain = () => {
        const chain: any = {
            select: vi.fn(),
            order: vi.fn(),
            limit: vi.fn(),
            eq: vi.fn(),
            range: vi.fn(),
            insert: vi.fn(),
        }
        chain.select.mockReturnValue(chain)
        chain.order.mockReturnValue(chain)
        chain.limit.mockResolvedValue({ data: [], error: null })
        chain.eq.mockReturnValue(chain)
        chain.range.mockResolvedValue({ data: [], error: null, count: 0 })
        chain.insert.mockResolvedValue({ data: null, error: null })
        return chain
    }

    return {
        supabase: {
            from: vi.fn(() => makeChain()),
        },
    }
})

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: ({ children }: any) => <div>{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
}))

const mockUser = { id: 'user-1' }
const mockProfile = {
    fname: 'Test',
    lname: 'User',
    email: 'test@example.com',
    org: 'Test Org',
    avatar: '',
    role: 'chairperson',
}

const resolvedStats: DashboardStats = { total: 10, pending: 3, completed: 7 }

describe('AnnouncementsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset to default: all queries resolve with empty data
        const makeChain = () => {
            const chain: any = {
                select: vi.fn(),
                order: vi.fn(),
                limit: vi.fn(),
                eq: vi.fn(),
                range: vi.fn(),
                insert: vi.fn(),
            }
            chain.select.mockReturnValue(chain)
            chain.order.mockReturnValue(chain)
            chain.limit.mockResolvedValue({ data: [], error: null })
            chain.eq.mockReturnValue(chain)
            chain.range.mockResolvedValue({ data: [], error: null, count: 0 })
            chain.insert.mockResolvedValue({ data: null, error: null })
            return chain
        }
        vi.mocked(supabase.from).mockImplementation(() => makeChain())
    })

    it('renders the Dashboard heading when statsLoader resolves immediately', async () => {
        const statsLoader = vi.fn().mockResolvedValue(resolvedStats)

        render(
            <AnnouncementsPage
                user={mockUser}
                profile={mockProfile}
                statsLoader={statsLoader}
            />
        )

        await waitFor(() => {
            expect(screen.getByText('Dashboard')).toBeInTheDocument()
        })
    })

    it('renders loading skeleton (animate-pulse) when statsLoader is pending', () => {
        const statsLoader = vi.fn().mockReturnValue(new Promise(() => {}))

        const { container } = render(
            <AnnouncementsPage
                user={mockUser}
                profile={mockProfile}
                statsLoader={statsLoader}
            />
        )

        expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })
})
