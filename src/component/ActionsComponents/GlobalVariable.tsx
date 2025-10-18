import React, { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/component/ui/card'
import { ChevronDownIcon, PlusIcon, FolderPlus, XIcon, Copy, ChevronDown, Loader2, Delete, TrashIcon, Edit } from 'lucide-react'
import Button from '../common/Button'
import { cloneFolderApiRequest, createFolderApiRequest, deleteFolderApiRequest, getFolderListApiRequest, updateFolderVariableApiRequest } from '@/network/api'
import { useSelector } from 'react-redux'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'

const defaultVariables = [
    'first_name',
    'last_name',
    'birthdate',
    'phone_number',
    'email_address',
    'reason_for_visit',
]

const GlobalVariable = ({ getFolderListData }: { getFolderListData: () => void }) => {
    const singleLoad = useRef(false)
    const companyData = useSelector((state: any) => state.company.companyData);
    const [showGuidelines, setShowGuidelines] = useState(false)
    const [selectedVariable, setSelectedVariable] = useState<string | undefined>()
    const [openAddGroup, setOpenAddGroup] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [groupNameError, setGroupNameError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [editingFolder, setEditingFolder] = useState<any>(null)
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
    const [showFolderList, setShowFolderList] = useState(false)
    const [folderList, setFolderList] = useState<any[]>([])
    const [openAddVariable, setOpenAddVariable] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState<any>(null)
    const [isAddingVariable, setIsAddingVariable] = useState(false)
    const [editingVariable, setEditingVariable] = useState<any>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [variableToDelete, setVariableToDelete] = useState<any>(null)
    const [cloningFolderId, setCloningFolderId] = useState<string | null>(null)
    const [showDeleteFolderConfirm, setShowDeleteFolderConfirm] = useState(false)
    const [folderToDelete, setFolderToDelete] = useState<any>(null)
    const [isDeletingFolder, setIsDeletingFolder] = useState(false)
    const [showCloneFolderModal, setShowCloneFolderModal] = useState(false)
    const [folderToClone, setFolderToClone] = useState<any>(null)
    const [cloneFolderName, setCloneFolderName] = useState('')
    const [isCloningFolder, setIsCloningFolder] = useState(false)
    // Handler for creating a new group
    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsLoading(true)
            
            if (editingFolder) {
                console.log("editingFolder==-=-=-", newGroupName)
                const { name, id, ...folderWithoutNameAndId } = editingFolder
                const payload = {
                    "name": newGroupName,
                    "is_default": editingFolder.is_default,
                    ...folderWithoutNameAndId
                }
                console.log("payload==-=-=-", payload)
                const response = await updateFolderVariableApiRequest(editingFolder.id, payload)
                console.log(response)
                toast.success('Folder updated successfully')
            } else {
                // Create new folder
                const payload = {
                    "name": newGroupName,
                    "company_id": companyData.id,
                    "is_default": true,
                    "properties": {
                        "phone_number": {
                            "type": "string",
                            "description": "Caller's phone number",
                            "enum": null
                        },
                        "email_address": {
                            "type": "string",
                            "description": "Caller's email address",
                            "enum": null
                        },
                        "first_name": {
                            "type": "string",
                            "description": "Caller's First name",
                            "enum": null
                        },
                        "reason_for_visit": {
                            "type": "string",
                            "description": "Caller's reason for visit",
                            "enum": null
                        },
                        "last_name": {
                            "type": "string",
                            "description": "Caller's Last name",
                            "enum": null
                        }
                    },
                }
                const response = await createFolderApiRequest(payload)
                console.log(response)
                toast.success('Folder created successfully')
            }
            
            getFolderListData()
            setOpenAddGroup(false)
            setNewGroupName('')
            setGroupNameError(null)
            setEditingFolder(null)
        } catch (error) {
            console.log(error)
            toast.error(editingFolder ? 'Failed to update folder' : 'Failed to create folder')
        } finally {
            setIsLoading(false)
        }
        
        setOpenAddGroup(false)
        setNewGroupName('')
        setGroupNameError(null)
        setEditingFolder(null)
    }

    const getFolderList = async () => {
        try {
            const response = await getFolderListApiRequest()
            setFolderList(response?.data?.folders)
        } catch (error) {
            console.log(error)
        }
    }

    // Variable type options
    const variableTypeOptions = [
        { value: 'string', label: 'String' },
        { value: 'number', label: 'Number' },
        { value: 'boolean', label: 'Boolean' },
        { value: 'array', label: 'Array' },
        { value: 'object', label: 'Object' }
    ]

    // Form schema for adding variables
    const variableSchema = z.object({
        name: z.string().min(1, { message: 'Variable name is required' })
            .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, { message: 'Variable name must start with a letter or underscore and contain only letters, numbers, and underscores' })
            .transform(val => val.toLowerCase().replace(/\s+/g, '_')), // Convert to lowercase with underscores
        description: z.string().min(1, { message: 'Description is required' }),
        type: z.string().optional()
    })

    const variableForm = useForm({
        resolver: zodResolver(variableSchema),
        defaultValues: {
            name: '',
            description: '',
            type: 'string'
        }
    })

    const handleAddVariable = async (data: any) => {
        try {
            setIsAddingVariable(true)
            console.log(editingVariable ? 'Editing variable:' : 'Adding variable:', data)

            // Create the variable object in the expected format
            const payload = {
                "name": selectedFolder.name,
                "is_default": selectedFolder.is_default,
                "properties": {
                    "phone_number": {
                        "type": "string",
                        "description": "Caller's phone number",
                        "enum": null
                    },
                    "email_address": {
                        "type": "string",
                        "description": "Caller's email address",
                        "enum": null
                    },
                    "first_name": {
                        "type": "string",
                        "description": "Caller's First name",
                        "enum": null
                    },
                    "reason_for_visit": {
                        "type": "string",
                        "description": "Caller's reason for visit",
                        "enum": null
                    },
                    "last_name": {
                        "type": "string",
                        "description": "Caller's Last name",
                        "enum": null
                    },
                    [data.name]: {
                        type: data.type,
                        description: data.description,
                    }
                },
            }


            const response = await updateFolderVariableApiRequest(selectedFolder.id, payload)
            console.log(response)

            // Show success message
            toast.success(editingVariable ? 'Variable updated successfully' : 'Variable added successfully')

            getFolderList()
            getFolderListData()
            setOpenAddVariable(false)
            setEditingVariable(null)
            variableForm.reset()
            // Refresh folder list
        } catch (error) {
            console.error('Error saving variable:', error)
            // Show error message
            toast.error(editingVariable ? 'Failed to update variable' : 'Failed to add variable')
        } finally {
            setIsAddingVariable(false)
        }
    }

    const handleEditFolder = (folder: any) => {
        setEditingFolder(folder)
        setNewGroupName(folder.name)
        setOpenAddGroup(true)
    }

    const openAddVariableModal = (folder: any) => {
        setSelectedFolder(folder)
        setEditingVariable(null) // Reset editing state
        variableForm.reset() // Reset form
        setOpenAddVariable(true)
    }

    const handleEditVariable = (variableName: string, variableData: any) => {
        setEditingVariable({ name: variableName, ...variableData })
        setOpenAddVariable(true)
        variableForm.reset({
            name: variableName,
            description: variableData.description,
            type: variableData.type
        })
    }

    const handleDeleteVariable = (variableName: string) => {
        console.log('handleDeleteVariable called with:', { variableName, selectedFolder });
        
        if (!selectedFolder) {
            console.error('No folder selected for variable deletion');
            toast.error('Please select a folder first');
            return;
        }
        
        setVariableToDelete({ 
            name: variableName, 
            folder: selectedFolder 
        });
        setShowDeleteConfirm(true);
    }

    const handleCloneFolder = (folder: any) => {
        setFolderToClone(folder)
        setCloneFolderName(folder.name + ' (Copy)')
        setShowCloneFolderModal(true)

    }

    const confirmCloneFolder = async () => {
        try {
            setIsCloningFolder(true)
            const response = await cloneFolderApiRequest(folderToClone.id, {
                "name": cloneFolderName,
            })
            console.log(response)
            toast.success('Folder cloned successfully')
            getFolderList()
            getFolderListData()
            setShowCloneFolderModal(false)
            setFolderToClone(null)
            setCloneFolderName('')
        } catch (error) {
            console.error('Error cloning folder:', error)
            toast.error('Failed to clone folder')
        } finally {
            setIsCloningFolder(false)
        }
    }

    const handleDeleteFolder = (folder: any) => {
        setFolderToDelete(folder)
        setShowDeleteFolderConfirm(true)
    }

    const confirmDeleteFolder = async () => {
        try {
            setIsDeletingFolder(true)
            const response = await deleteFolderApiRequest(folderToDelete.id)
            console.log(response)
            toast.success('Folder deleted successfully')
            getFolderList()
            getFolderListData()
            setShowDeleteFolderConfirm(false)
            setFolderToDelete(null)
        } catch (error) {
            console.error('Error deleting folder:', error)
            toast.error('Failed to delete folder')
        } finally {
            setIsDeletingFolder(false)
        }
    }

    const confirmDeleteVariable = async () => {
        try {
            // Check if variableToDelete exists and has required data
            if (!variableToDelete || !variableToDelete.folder) {
                console.error('variableToDelete or variableToDelete.folder is null:', variableToDelete);
                toast.error('Invalid variable data for deletion');
                setShowDeleteConfirm(false);
                setVariableToDelete(null);
                return;
            }

            // Get the current folder data
            const currentFolder = variableToDelete.folder;
            
            // Check if folder has properties
            if (!currentFolder.properties) {
                console.error('Folder properties is null:', currentFolder);
                toast.error('Folder data is invalid');
                setShowDeleteConfirm(false);
                setVariableToDelete(null);
                return;
            }
            
            // Create a new properties object without the variable to delete
            const updatedProperties = { ...currentFolder.properties };
            delete updatedProperties[variableToDelete.name];
            
            // Create the payload with all properties except the deleted one
            const payload = {
                "name": currentFolder.name,
                "is_default": currentFolder.is_default,
                "properties": updatedProperties
            }
            
            const response = await updateFolderVariableApiRequest(currentFolder.id, payload)
            console.log(response)
            
            toast.success('Variable deleted successfully')
            setShowDeleteConfirm(false)
            setVariableToDelete(null)
            getFolderList()
            getFolderListData()
        } catch (error) {
            console.error('Error deleting variable:', error)
            toast.error('Failed to delete variable')
        }
    }

    const copyVariableToClipboard = async (variableName: string) => {
        try {
            await navigator.clipboard.writeText(variableName)
            toast.success('Variable name copied to clipboard')
        } catch (error) {
            console.error('Failed to copy to clipboard:', error)
            toast.error('Failed to copy variable name')
        }
    }

    useEffect(() => {
        if (!singleLoad.current) {
            getFolderList()
            singleLoad.current = true
        }
    }, [])

    return (
        <div>
            <div className="space-y-8 w-full h-full">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg text-gray-900 font-semibold">Global Variables</h3>
                    <Button
                        variant="primary"
                        className="px-4 border border-gray-300 bg-white text-gray-900 py-2"
                        onClick={() => setOpenAddGroup(true)}
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        New Group
                    </Button>
                </div>

                {/* Inline "Dialog" for creating a new group */}


                <Card className="border-0 shadow-lg overflow-hidden bg-white">
                    <CardHeader
                        className="flex flex-row items-center justify-between cursor-pointer px-6 py-4 bg-gray-50"
                        onClick={() => setShowGuidelines((v) => !v)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-blue-100 p-2">
                                <ChevronDownIcon
                                    className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${showGuidelines ? 'rotate-180' : ''}`}
                                />
                            </div>
                            <CardTitle className="text-blue-900 text-base font-semibold tracking-wide">
                                Variable Group Usage Guidelines
                            </CardTitle>
                        </div>
                        <span className="ml-2 flex items-center gap-2 text-sm text-blue-700 font-medium select-none">
                            {showGuidelines ? 'Hide' : 'Show'}
                        </span>
                    </CardHeader>
                    {showGuidelines && (
                        <CardContent className="bg-white/80 rounded-b-lg px-6 py-5 animate-fade-in-down">
                            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-800">
                                <li>
                                    <span className="font-semibold text-blue-700">Important:</span> You can only use <span className="font-semibold">one group</span> of variables at a time in your application.
                                </li>
                                <li>
                                    Use the <span className="font-semibold text-blue-700">Default Variables Group</span> as-is with the standard variables.
                                </li>
                                <li>
                                    Add new <span className="font-semibold text-blue-700">custom variables</span> to the <span className="font-semibold">Default Variables Group</span>.
                                </li>
                                <li>
                                    Create a <span className="font-semibold text-blue-700">copy</span> of the Default Group and customize it with additional variables.
                                </li>
                                <li>
                                    Create a <span className="font-semibold text-blue-700">completely new group</span> with your own variables.
                                </li>
                            </ul>
                            <div className="mt-5 text-xs text-blue-900/80 bg-blue-100 rounded px-3 py-2 border border-blue-200 flex items-center gap-2">
                                <span className="inline-block bg-blue-400/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-blue-700 mr-2">Note</span>
                                Default variables ( first_name, last_name, birthdate, phone_number, email_address, reason_for_visit ) cannot be edited to maintain system consistency. All variable names are automatically converted to lowercase with underscores.
                            </div>
                        </CardContent>
                    )}
                </Card>
                <div>

                    {folderList.length > 0 && folderList.map((folder: any, folderIdx: number) => {
                        // For each folder, show its name and count of variables
                        const properties = folder.properties || {};
                        const propertyKeys = Object.keys(properties);
                        const isDefault = folder.is_default;
                        // Each folder can have its own expand/collapse state
                        // We'll use a local state array to track which folder is open
                        // For simplicity, you may want to refactor this to use a state array in the parent component
                        // Here, let's use a single open state for all for now (replace with per-folder if needed)
                        return (
                            <Card key={folder.id} className="mt-8 p-4">
                                <div
                                    className="flex items-center gap-2 justify-between mb-2 cursor-pointer"
                                    onClick={() => {
                                        const newOpenFolders = new Set(openFolders)
                                        if (newOpenFolders.has(folder.id)) {
                                            newOpenFolders.delete(folder.id)
                                        } else {
                                            newOpenFolders.add(folder.id)
                                        }
                                        setOpenFolders(newOpenFolders)
                                    }}
                                    >
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900">
                                            {isDefault ? "Default Variables" : folder.name}
                                        </label>
                                        <span className="text-xs text-gray-500 ml-2">
                                            {propertyKeys.length} variable{propertyKeys.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="cursor-pointer"
                                            title="Delete folder"
                                            onClick={() => handleEditFolder(folder)}
                                        >
                                            <Edit className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {cloningFolderId === folder.id ? (
                                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                            ) : (
                                                <div
                                                    className="cursor-pointer"
                                                    title="Clone folder"
                                                    onClick={() => handleCloneFolder(folder)}
                                                >
                                                    <Copy className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className="cursor-pointer"
                                            title="Delete folder"
                                            onClick={() => handleDeleteFolder(folder)}
                                        >
                                            <TrashIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                                        </div>
                                        <div
                                            className={`cursor-pointer transition-transform duration-500 ${openFolders.has(folder.id) ? 'rotate-180 ' : ''}`}
                                            onClick={e => {
                                                e.stopPropagation();
                                                const newOpenFolders = new Set(openFolders)
                                                if (newOpenFolders.has(folder.id)) {
                                                    newOpenFolders.delete(folder.id)
                                                } else {
                                                    newOpenFolders.add(folder.id)
                                                }
                                                setOpenFolders(newOpenFolders)
                                            }}
                                        >
                                            <ChevronDown className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>

                                {openFolders.has(folder.id) && (
                                    <div className={`transition-all duration-500 ${openFolders.has(folder.id) ? 'opacity-100 h-auto' : 'opacity-0 h-0'}`}>
                                        <button
                                            type="button"
                                            className="inline-flex w-full items-center my-5 px-3 py-2 border border-gray-300 text-gray-900 text-xs font-medium rounded hover:bg-gray-100 transition"
                                            disabled={isDefault}
                                            title={isDefault ? "Add Variable (disabled for default group)" : "Add Variable"}
                                            onClick={() => !isDefault && openAddVariableModal(folder)}
                                        >
                                            <PlusIcon className="w-4 h-4 mr-2" /> Add Variable
                                        </button>
                                        <div className="grid grid-cols-4 gap-4">
                                            {propertyKeys.map((key) => {
                                                const prop = properties[key];
                                                const isDefaultVariable = defaultVariables.includes(key);
                                                return (
                                                    <Card
                                                        key={key}
                                                        className="px-4 space-y-1 py-3 relative group hover:shadow-md transition-shadow"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="inline-block w-20 text-xs font-medium text-gray-700 bg-blue-100 p-1.5 rounded-full text-center">
                                                                    {prop.type}
                                                                </p>
                                                                <p className="flex-1 text-sm font-mono text-gray-900 mt-2">{key}</p>
                                                                <p className="text-xs text-gray-500 mt-1">{prop.description}</p>
                                                            </div>
                                                            {!isDefaultVariable && (
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            copyVariableToClipboard(key);
                                                                        }}
                                                                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                                        title="Copy variable name"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleEditVariable(key, prop);
                                                                        }}
                                                                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                                        title="Edit variable"
                                                                    >
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            // Set the selected folder before deleting
                                                                            setSelectedFolder(folder);
                                                                            handleDeleteVariable(key);
                                                                        }}
                                                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                                        title="Delete variable"
                                                                    >
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
                {openAddGroup && (
                    <div className="fixed inset-0 z-[2000] !m-0  bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                            <button
                                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                                onClick={() => { setOpenAddGroup(false); setGroupNameError(null); }}
                                aria-label="Close"
                                type="button"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                            <form onSubmit={handleCreateGroup} >
                                                            <div className="flex items-center mb-4">
                                <FolderPlus className="w-6 h-6 text-blue-600 mr-2" />
                                <h4 className="text-lg font-semibold text-gray-900">
                                    {editingFolder ? 'Edit Folder' : 'Create New Group'}
                                </h4>
                            </div>
                                <div className="mb-4">
                                    <label
                                        htmlFor="new-group-name"
                                        className={`block text-sm font-medium mb-1 ${groupNameError ? 'text-red-600' : 'text-gray-900'}`}
                                    >
                                        Group Name
                                    </label>
                                    <input
                                        id="new-group-name"
                                        type="text"
                                        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none ${groupNameError ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="Enter group name"
                                        value={newGroupName}
                                        onChange={e => {
                                            setNewGroupName(e.target.value)
                                            if (groupNameError) setGroupNameError(null)
                                        }}
                                        autoFocus
                                    />
                                    {groupNameError && (
                                        <div className="text-xs text-red-600 mt-1">{groupNameError}</div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2">
                                                                    <Button
                                    type="button"
                                    variant="secondary"
                                    className="px-4 py-2"
                                    onClick={() => { 
                                        setOpenAddGroup(false); 
                                        setGroupNameError(null);
                                        setEditingFolder(null);
                                        setNewGroupName('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                                                    <Button
                                    type="submit"
                                    variant="primary"
                                    className="px-4 py-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2" />
                                            {editingFolder ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        editingFolder ? 'Update Folder' : 'Create Group'
                                    )}
                                </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Variable Modal */}
            {openAddVariable && (
                <div className="fixed inset-0 z-[2000] !m-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                            onClick={() => {
                                setOpenAddVariable(false);
                                variableForm.reset();
                            }}
                            aria-label="Close"
                            type="button"
                        >
                            <span className="text-2xl">&times;</span>
                        </button>

                        <form onSubmit={variableForm.handleSubmit(handleAddVariable)}>
                            <div className="flex items-center mb-4">
                                <PlusIcon className="w-6 h-6 text-blue-600 mr-2" />
                                <h4 className="text-lg font-semibold text-gray-900">
                                    {editingVariable ? 'Edit Variable' : 'Add New Variable'}
                                </h4>
                            </div>

                            {selectedFolder && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        Adding to: <span className="font-semibold">{selectedFolder.is_default ? 'Default Variables' : selectedFolder.name}</span>
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="variable-name"
                                        className={`block text-sm font-medium mb-1 ${variableForm.formState.errors.name ? 'text-red-600' : 'text-gray-900'}`}
                                    >
                                        Variable Name
                                    </label>
                                    <input
                                        id="variable-name"
                                        type="text"
                                        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${variableForm.formState.errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="e.g., customer_id, order_number"
                                        {...variableForm.register('name')}
                                        autoFocus
                                    />
                                    {variableForm.formState.errors.name && (
                                        <div className="text-xs text-red-600 mt-1">{variableForm.formState.errors.name?.message}</div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">
                                        Variable names will be automatically converted to lowercase with underscores
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="variable-description"
                                        className={`block text-sm font-medium mb-1 ${variableForm.formState.errors.description ? 'text-red-600' : 'text-gray-900'}`}
                                    >
                                        Description
                                    </label>
                                    <textarea
                                        id="variable-description"
                                        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${variableForm.formState.errors.description ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Describe what this variable represents"
                                        rows={3}
                                        {...variableForm.register('description')}
                                    />
                                    {variableForm.formState.errors.description && (
                                        <div className="text-xs text-red-600 mt-1">{variableForm.formState.errors.description?.message}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="px-4 py-2"
                                    onClick={() => {
                                        setOpenAddVariable(false);
                                        setEditingVariable(null);
                                        variableForm.reset();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="px-4 py-2"
                                    disabled={isAddingVariable}
                                >
                                    {isAddingVariable ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {editingVariable ? 'Updating...' : 'Adding...'}
                                        </>
                                    ) : (
                                        editingVariable ? 'Update Variable' : 'Add Variable'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[2000] !m-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <div className="flex items-center mb-4">
                            <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <h4 className="text-lg font-semibold text-gray-900">Delete Variable</h4>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-700 mb-2">
                                Are you sure you want to delete the variable <span className="font-mono font-semibold text-red-600">{variableToDelete?.name}</span>?
                            </p>
                            <p className="text-sm text-gray-500">
                                This action cannot be undone. The variable will be permanently removed from the folder.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                className="px-4 py-2"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setVariableToDelete(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                className="px-4 py-2 bg-red-600 hover:bg-red-700"
                                onClick={confirmDeleteVariable}
                            >
                                Delete Variable
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Folder Confirmation Modal */}
            {showDeleteFolderConfirm && (
                <div className="fixed inset-0 z-[2000] !m-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <div className="flex items-center mb-4">
                            <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <h4 className="text-lg font-semibold text-gray-900">Delete Folder</h4>
                        </div>

                        <div className="mb-6">
                            <p className="text-gray-700 mb-2">
                                Are you sure you want to delete the folder <span className="font-semibold text-red-600">{folderToDelete?.name}</span>?
                            </p>
                            <p className="text-sm text-gray-500">
                                This action cannot be undone. The folder and all its variables will be permanently removed.
                            </p>
                            {folderToDelete?.is_default && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Warning:</strong> This is a default folder. Deleting it may affect system functionality.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                className="px-4 py-2"
                                onClick={() => {
                                    setShowDeleteFolderConfirm(false);
                                    setFolderToDelete(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                className="px-4 py-2 bg-red-600 hover:bg-red-700"
                                onClick={confirmDeleteFolder}
                                disabled={isDeletingFolder}
                            >
                                {isDeletingFolder ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Folder'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clone Folder Modal */}
            {showCloneFolderModal && (
                <div className="fixed inset-0 z-[2000] !m-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                            onClick={() => {
                                setShowCloneFolderModal(false);
                                setFolderToClone(null);
                                setCloneFolderName('');
                            }}
                            aria-label="Close"
                            type="button"
                        >
                            <span className="text-2xl">&times;</span>
                        </button>
                        
                        <div className="flex items-center mb-4">
                            <Copy className="w-6 h-6 text-blue-600 mr-2" />
                            <h4 className="text-lg font-semibold text-gray-900">Clone Folder</h4>
                        </div>
                        
                        <div className="mb-4">
                            <label
                                htmlFor="clone-folder-name"
                                className="block text-sm font-medium mb-1 text-gray-900"
                            >
                                New Folder Name
                            </label>
                            <input
                                id="clone-folder-name"
                                type="text"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter new folder name"
                                value={cloneFolderName}
                                onChange={(e) => setCloneFolderName(e.target.value)}
                                autoFocus
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                This will create a copy of "{folderToClone?.name}" with all its variables
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                className="px-4 py-2"
                                onClick={() => {
                                    setShowCloneFolderModal(false);
                                    setFolderToClone(null);
                                    setCloneFolderName('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                className="px-4 py-2"
                                onClick={confirmCloneFolder}
                                disabled={isCloningFolder || !cloneFolderName.trim()}
                            >
                                {isCloningFolder ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Cloning...
                                    </>
                                ) : (
                                    'Clone Folder'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GlobalVariable