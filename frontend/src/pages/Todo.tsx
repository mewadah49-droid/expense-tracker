import { useState, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, Calendar } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Todo {
    id: number
    text: string
    completed: boolean
    created_at: string
}

// 3D Tilt Card Component (reused from Dashboard)
interface TiltCardProps {
    children: React.ReactNode
    className?: string
    color?: 'slate' | 'emerald' | 'rose' | 'amber' | 'blue'
    index?: number
}

function TiltCard({ children, className = '', color = 'slate', index = 0 }: TiltCardProps) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const ref = useRef<HTMLDivElement>(null)

    const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
    const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg'])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg'])

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top
        const xPct = mouseX / rect.width - 0.5
        const yPct = mouseY / rect.height - 0.5
        x.set(xPct)
        y.set(yPct)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    const colorSchemes = {
        slate: 'from-slate-400 via-gray-400 to-zinc-400 shadow-slate-500/20',
        emerald: 'from-emerald-400 via-teal-500 to-cyan-500 shadow-emerald-500/25',
        rose: 'from-rose-400 via-red-500 to-orange-400 shadow-rose-500/25',
        amber: 'from-amber-400 via-orange-500 to-yellow-400 shadow-amber-500/25',
        blue: 'from-blue-400 via-sky-500 to-cyan-400 shadow-blue-500/25',
    }

    const borderGradient = colorSchemes[color]

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 30 }}
            style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
            }}
            className={`relative group ${className}`}
        >
            <div
                className="relative h-full bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl shadow-slate-200/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-slate-200/60 overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <motion.div
                    className={`absolute -inset-0.5 bg-gradient-to-r ${borderGradient} rounded-2xl opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500`}
                />
                <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/60 via-transparent to-slate-100/30"
                />
                <div className="relative h-full p-6" style={{ transform: 'translateZ(40px)' }}>
                    {children}
                </div>
            </div>
        </motion.div>
    )
}

export default function Todo() {
    const queryClient = useQueryClient()
    const [newTodo, setNewTodo] = useState('')

    // Fetch tasks
    const { data: todos = [], isLoading } = useQuery<Todo[]>({
        queryKey: ['tasks'],
        queryFn: async () => {
            const response = await api.get('/api/tasks/')
            return response.data
        },
    })

    // Create task
    const createTask = useMutation({
        mutationFn: async (text: string) => {
            const response = await api.post('/api/tasks/', { text })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            setNewTodo('')
            toast.success('Task added')
        },
        onError: () => {
            toast.error('Failed to add task')
        }
    })

    // Toggle completion
    const toggleTask = useMutation({
        mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
            const response = await api.patch(`/api/tasks/${id}/`, { completed })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
        },
        onError: () => {
            toast.error('Failed to update task')
        }
    })

    // Delete task
    const deleteTask = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/api/tasks/${id}/`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            toast.success('Task deleted')
        },
        onError: () => {
            toast.error('Failed to delete task')
        }
    })

    const addTodo = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTodo.trim()) return
        createTask.mutate(newTodo.trim())
    }

    const activeTodos = todos.filter(t => !t.completed)
    const completedTodos = todos.filter(t => t.completed)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8"
            style={{ perspective: '1000px' }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
            >
                <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-lg shadow-slate-500/25">
                    <ListTodo className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Todo List</h1>
                    <p className="text-slate-500">Manage your financial tasks and goals</p>
                </div>
            </motion.div>

            {/* Input Section - Glassmorphism */}
            <motion.form
                onSubmit={addTodo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative group"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-300 to-gray-300 rounded-2xl opacity-30 group-hover:opacity-60 blur transition duration-500 group-focus-within:opacity-80" />
                <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Plus className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder="Add a new task..."
                        className="w-full pl-12 pr-24 py-4 bg-transparent text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
                        disabled={createTask.isPending}
                    />
                    <button
                        type="submit"
                        disabled={!newTodo.trim() || createTask.isPending}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-slate-800 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-slate-900 transition-colors shadow-lg shadow-slate-500/25"
                    >
                        {createTask.isPending ? 'Adding...' : 'Add'}
                    </button>
                </div>
            </motion.form>

            {/* Stats - 3D Tilt Cards */}
            <div className="grid grid-cols-3 gap-4" style={{ transformStyle: 'preserve-3d' }}>
                <TiltCard color="slate" index={0}>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-slate-800">{todos.length}</p>
                        <p className="text-sm text-slate-500 font-medium mt-1">Total Tasks</p>
                    </div>
                </TiltCard>
                <TiltCard color="emerald" index={1}>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-emerald-600">{completedTodos.length}</p>
                        <p className="text-sm text-slate-500 font-medium mt-1">Completed</p>
                    </div>
                </TiltCard>
                <TiltCard color="amber" index={2}>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-amber-600">{activeTodos.length}</p>
                        <p className="text-sm text-slate-500 font-medium mt-1">Pending</p>
                    </div>
                </TiltCard>
            </div>

            {/* Tasks List - Glassmorphism */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-20 text-slate-400 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60">
                        Loading tasks...
                    </div>
                ) : (
                    <>
                        {/* Active Tasks */}
                        <AnimatePresence mode="popLayout">
                            {activeTodos.map((todo, index) => (
                                <motion.div
                                    layout
                                    key={todo.id}
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative"
                                >
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-200 to-gray-200 rounded-xl opacity-0 group-hover:opacity-50 blur transition duration-300" />
                                    <div className="relative flex items-center gap-3 p-4 bg-white/90 backdrop-blur-xl rounded-xl border border-white/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                                        <button
                                            onClick={() => toggleTask.mutate({ id: todo.id, completed: !todo.completed })}
                                            className="flex-shrink-0 text-slate-400 hover:text-emerald-500 transition-colors"
                                            disabled={toggleTask.isPending}
                                        >
                                            <Circle className="w-6 h-6" />
                                        </button>
                                        <span className="flex-1 text-lg text-slate-700 font-medium">{todo.text}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(todo.created_at).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={() => deleteTask.mutate(todo.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                disabled={deleteTask.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Completed Tasks Divider */}
                        {completedTodos.length > 0 && activeTodos.length > 0 && (
                            <div className="relative py-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-slate-50 px-4 text-sm text-slate-500 font-medium rounded-full border border-slate-200">
                                        Completed
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Completed Tasks */}
                        <AnimatePresence mode="popLayout">
                            {completedTodos.map((todo) => (
                                <motion.div
                                    layout
                                    key={todo.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 0.7, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group flex items-center gap-3 p-4 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200/60 transition-all hover:opacity-100"
                                >
                                    <button
                                        onClick={() => toggleTask.mutate({ id: todo.id, completed: !todo.completed })}
                                        className="flex-shrink-0 text-emerald-500 hover:text-emerald-600 transition-colors"
                                        disabled={toggleTask.isPending}
                                    >
                                        <CheckCircle2 className="w-6 h-6" />
                                    </button>
                                    <span className="flex-1 text-lg text-slate-500 line-through decoration-2 decoration-slate-300 decoration-wavy">
                                        {todo.text}
                                    </span>
                                    <button
                                        onClick={() => deleteTask.mutate(todo.id)}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        disabled={deleteTask.isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {todos.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60"
                            >
                                <div className="inline-block p-4 bg-slate-100 rounded-2xl mb-4 border border-slate-200">
                                    <ListTodo className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-700">No tasks yet</h3>
                                <p className="text-slate-500 mt-2">Add a task to get started!</p>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    )
}