import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
            className="max-w-4xl mx-auto space-y-8"
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
            >
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                    <ListTodo className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Todo List</h1>
                    <p className="text-slate-500">Manage your financial tasks and goals</p>
                </div>
            </motion.div>

            {/* Input Section */}
            <motion.form
                onSubmit={addTodo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
            >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Plus className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Add a new task..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg"
                    disabled={createTask.isPending}
                />
                <button
                    type="submit"
                    disabled={!newTodo.trim() || createTask.isPending}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                >
                    {createTask.isPending ? 'Adding...' : 'Add'}
                </button>
            </motion.form>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-3xl font-bold text-indigo-600">{todos.length}</p>
                    <p className="text-sm text-slate-500">Total Tasks</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-3xl font-bold text-emerald-600">{completedTodos.length}</p>
                    <p className="text-sm text-slate-500">Completed</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-3xl font-bold text-amber-600">{activeTodos.length}</p>
                    <p className="text-sm text-slate-500">Pending</p>
                </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="text-center py-20 text-slate-400">Loading tasks...</div>
                ) : (
                    <>
                        {/* Active Tasks */}
                        <AnimatePresence mode="popLayout">
                            {activeTodos.map((todo) => (
                                <motion.div
                                    layout
                                    key={todo.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
                                >
                                    <button
                                        onClick={() => toggleTask.mutate({ id: todo.id, completed: !todo.completed })}
                                        className="flex-shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
                                        disabled={toggleTask.isPending}
                                    >
                                        <Circle className="w-6 h-6" />
                                    </button>
                                    <span className="flex-1 text-lg text-slate-700">{todo.text}</span>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
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
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Completed Tasks Divider */}
                        {completedTodos.length > 0 && activeTodos.length > 0 && (
                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-[#f8fafc] px-4 text-sm text-slate-500">Completed</span>
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
                                    animate={{ opacity: 0.6, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="group flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all opacity-60 hover:opacity-100"
                                >
                                    <button
                                        onClick={() => toggleTask.mutate({ id: todo.id, completed: !todo.completed })}
                                        className="flex-shrink-0 text-emerald-500"
                                        disabled={toggleTask.isPending}
                                    >
                                        <CheckCircle2 className="w-6 h-6" />
                                    </button>
                                    <span className="flex-1 text-lg text-slate-500 line-through decoration-2 decoration-slate-300">
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
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20"
                            >
                                <div className="inline-block p-4 bg-indigo-50 rounded-full mb-4">
                                    <ListTodo className="w-8 h-8 text-indigo-500" />
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
