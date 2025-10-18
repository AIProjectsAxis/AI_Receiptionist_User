import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/component/ui/form';
import { Input } from '@/component/ui/input';
import { Textarea } from '@/component/ui/textarea';
import Button from '@/component/common/Button';
import { Search, X, Plus, Trash2, FileIcon } from 'lucide-react';
import { createActionApiRequest, getActionByIdApiRequest, getKnowledgeBaseDocumentsListApiRequest, updateActionApiRequest } from '@/network/api';
import { toast } from 'react-toastify';
import Card from '@/component/common/Card';
import { CardHeader, CardTitle } from '@/component/ui/card';
import { formatDate } from '@/_utils/general';

const FormSchema = z.object({
    toolName: z.string().min(1, "Tool name is required"),
    description: z.string().min(1, "Description is required"),
    knowledgeBases: z.array(z.object({
        name: z.string().min(1, "Knowledge base name is required"),
        fileIds: z.array(z.string()).min(1, "At least one file need"),
        description: z.string().min(1, "Knowledge base description is required"),
        provider: z.string().default("google")
    })),
    messages: z.object({
        requestStart: z.string().min(1, "Request start message is required"),
        requestFailed: z.string().min(1, "Request failed message is required")
    })
});

type Props = {
    isEdit?: boolean;
    setViewEditActionId?: (id: string) => void;
    setShowQueryToolForm?: (show: boolean) => void;
    getAllActionList?: () => void;
    viewEditActionId: string;
};

const QueryToolComponent = ({ isEdit, setViewEditActionId, setShowQueryToolForm, getAllActionList, viewEditActionId }: Props) => {

    const [loading, setLoading] = useState(false);
    const [knowledgeBaseList, setKnowledgeBaseList] = useState<any[]>([]);
    const handleClose = () => {
        if (setShowQueryToolForm) {
            setShowQueryToolForm(false);
            setViewEditActionId?.("");
            form.reset()
        }
    };

    const getFileIconBgColor = (type: string) => {
        return `bg-${type}-500`;
    };

    const getFileIcon = (type: string) => {
        return <FileIcon type={type} />;
    };
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            toolName: "",
            description: "",
            knowledgeBases: [{
                name: "",
                fileIds: [],
                description: "",
                provider: "google"
            }],
            messages: {
                requestStart: "Let me search our knowledge base for that information...",
                requestFailed: "Sorry, I couldn't find that information"
            }
        }
    });


    const getQueryToolData = async () => {
        try {
            const res = await getActionByIdApiRequest(viewEditActionId as string);
            const actionData = res?.data?.action;

            form.reset({
                toolName: actionData?.name || "",
                description: actionData?.function?.description || "",
                knowledgeBases: actionData?.knowledge_bases?.map((kb: any) => ({
                    name: kb?.name || "",
                    fileIds: kb?.file_ids?.filter((id: string) => id !== "") || [],
                    description: kb?.description || "",
                    provider: kb?.provider || "google"
                })) || [{
                    name: "",
                    fileIds: [],
                    description: "",
                    provider: "google"
                }],
                messages: {
                    requestStart: actionData?.messages?.[0]?.content || "",
                    requestFailed: actionData?.messages?.[1]?.content || ""
                }
            });
        } catch (error) {
            console.error('Error fetching query tool data:', error);
            toast.error('Failed to fetch query tool data',{
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
              });
        }
    };

    const onSubmit = async (data: z.infer<typeof FormSchema>) => {
        try {
            setLoading(true);
            const payload = {
                "type": "query",
                "name": data.toolName,
                "async_": null,
                "messages": [
                    {
                        "contents": null,
                        "content": data.messages.requestStart,
                        "conditions": null,
                        "type": "request-start",
                        "blocking": true
                    },
                    {
                        "contents": null,
                        "content": data.messages.requestFailed,
                        "conditions": null,
                        "type": "request-failed",
                        "end_call_after_spoken_enabled": true
                    }
                ],
                "function": {
                    "name": "query_tool",
                    "description": data.description
                },
                "server": {
                    "url": "",
                    "timeout_seconds": null,
                    "secret": null,
                    "headers": null,
                    "backoff_plan": null
                },

                "destinations": null,
                "knowledge_bases": data.knowledgeBases.map(kb => ({
                    "name": kb.name,
                    "file_ids": kb.fileIds.filter(id => id !== ""),
                    "provider": kb.provider,
                    "description": kb.description
                })),
                "function_type": null,
                "notification": null,
                "async": false
            }


            if (viewEditActionId) {
                await updateActionApiRequest(viewEditActionId, payload);
                toast.success('Query tool updated successfully',{
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
            } else {
                await createActionApiRequest(payload);
                toast.success('Query tool created successfully',{
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
            }

            handleClose();
            if (setViewEditActionId) {
                setViewEditActionId("");
                form.reset()
            }
            getAllActionList?.();
            form.reset()
        } catch (error) {
            console.error('Error saving query tool:', error);
            toast.error('Failed to save query tool',{
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        } finally {
            setLoading(false);
        }
    };

    const addKnowledgeBase = () => {
        const currentKnowledgeBases = form.getValues("knowledgeBases");
        form.setValue("knowledgeBases", [...currentKnowledgeBases, {
            name: "",
            fileIds: [],
            description: "",
            provider: "google"
        }]);
    };

    const removeKnowledgeBase = (index: number) => {
        const currentKnowledgeBases = form.getValues("knowledgeBases");
        if (currentKnowledgeBases.length > 1) {
            form.setValue(
                "knowledgeBases",
                currentKnowledgeBases.filter((_, i) => i !== index)
            );
        }
    };

    const addFileId = (kbIndex: number) => {
        const currentFileIds = form.getValues(`knowledgeBases.${kbIndex}.fileIds`);
        form.setValue(`knowledgeBases.${kbIndex}.fileIds`, [...currentFileIds, ""]);
    };

    const removeFileId = (kbIndex: number, fileIndex: number) => {
        const currentFileIds = form.getValues(`knowledgeBases.${kbIndex}.fileIds`);
        form.setValue(
            `knowledgeBases.${kbIndex}.fileIds`,
            currentFileIds.filter((_, i) => i !== fileIndex)
        );
    };

    const getKnowledgeBase = async () => {
        try {
            const response = await getKnowledgeBaseDocumentsListApiRequest()
            setKnowledgeBaseList(response?.data?.files)
        } catch (error) {
            console.error("Error fetching knowledge base:", error)
        }
    }

    useEffect(() => {
        getKnowledgeBase()
    }, [])

    useEffect(() => {
        if (viewEditActionId) {
            getQueryToolData();
        }
    }, [viewEditActionId]);

    return (
        <div className="">
            <div className="bg-white rounded-xl w-full  overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mt-2 pb-4  border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Knowledge Base Query Configuration</h2>
                            <p className="text-sm text-gray-500">Configure your knowledge base query settings</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 ">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                        >
                            Cancel
                        </button>
                        <button
                            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200"
                            type="submit"
                            disabled={loading}
                            onClick={form.handleSubmit(onSubmit)}
                        >
                            {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> }
                            {viewEditActionId ? "Update" : "Create"}
                        </button>
                    </div>

                </div>

                {/* Content */}
                <div className="mt-6 px-1">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="toolName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tool Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter tool name" />
                                            </FormControl>
                                            <FormMessage className='text-red-500 text-[12px]' />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder="Enter description" />
                                            </FormControl>
                                            <FormMessage className='text-red-500 text-[12px]' />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {/* Messages Configuration */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Messages</h3>

                                <FormField
                                    control={form.control}
                                    name="messages.requestStart"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Request Start Message</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder="Enter request start message" />
                                            </FormControl>
                                            <FormMessage className='text-red-500 text-[12px]' />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="messages.requestFailed"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Request Failed Message</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} placeholder="Enter request failed message" />
                                            </FormControl>
                                            <FormMessage className='text-red-500 text-[12px]' />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Knowledge Base Configuration */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">Knowledge Base Settings</h3>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={addKnowledgeBase}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Knowledge Base
                                    </Button>
                                </div>

                                {form.watch("knowledgeBases").map((kb, kbIndex) => (
                                    <div key={kbIndex} className="border p-4 rounded-lg space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium">Knowledge Base #{kbIndex + 1}</h4>
                                            {kbIndex > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() => removeKnowledgeBase(kbIndex)}
                                                    className="px-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name={`knowledgeBases.${kbIndex}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Knowledge Base Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Enter knowledge base name" />
                                                    </FormControl>
                                                    <FormMessage className='text-red-500 text-[12px]' />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`knowledgeBases.${kbIndex}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Knowledge Base Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} placeholder="Enter knowledge base description" />
                                                    </FormControl>
                                                    <FormMessage className='text-red-500 text-[12px]' />
                                                </FormItem>
                                            )}
                                        />

                                        <Card style={{ padding: "0px" }}>

                                            <div>
                                                {knowledgeBaseList.length === 0 && (
                                                    <>
                                                        <div className="flex items-center p-3 md:p-4 px-0 bg-white rounded-md border border-gray-200 gap-3 md:gap-4 hover:shadow-md transition-shadow">
                                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-200">
                                                                <FileIcon className="h-5 w-5 text-gray-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-gray-800 text-sm md:text-base mb-1 truncate">No files found in knowledge base</div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {knowledgeBaseList.map((doc: any) => (
                                                    <div key={doc.id} className="flex items-center p-3 md:p-4 px-0 bg-white rounded-md border border-gray-200 gap-3 md:gap-4 hover:shadow-md transition-shadow">
                                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-md flex items-center justify-center flex-shrink-0 ${getFileIconBgColor(doc.type)}`}>
                                                            {getFileIcon(doc.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-800 text-sm md:text-base mb-1 truncate" title={doc.name}>{doc.name}</div>
                                                            <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-1 text-xs text-gray-500">
                                                                <span>{formatFileSize(doc.bytes)}</span>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="whitespace-nowrap">Uploaded: {formatDate(doc?.created_at?.split('T')[0])}</span>

                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 md:gap-2 flex-shrink-0">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="p-1.5 border-2 border-rose-50"
                                                                title="Select Document"
                                                                onClick={() => {
                                                                    const currentFileIds = form.getValues(`knowledgeBases.${kbIndex}.fileIds`);
                                                                    if (currentFileIds.includes(doc.id)) {
                                                                        form.setValue(`knowledgeBases.${kbIndex}.fileIds`, currentFileIds.filter(id => id !== doc.id));
                                                                    } else {
                                                                        form.setValue(`knowledgeBases.${kbIndex}.fileIds`, [...currentFileIds, doc.id]);
                                                                    }
                                                                }}
                                                            >
                                                                {form.getValues(`knowledgeBases.${kbIndex}.fileIds`).includes(doc.id) ? "✓ Selected" : 'Select'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>

                                        <FormField
                                            control={form.control}
                                            name={`knowledgeBases.${kbIndex}.fileIds`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormMessage className='text-red-500 text-[12px]' />
                                                </FormItem>
                                            )}
                                        />

                                        {kb.fileIds.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="mb-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`knowledgeBases.${kbIndex}.fileIds`}
                                                        render={() => (
                                                            <FormItem>
                                                                <FormLabel>File IDs</FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {form.watch(`knowledgeBases.${kbIndex}.fileIds`).map((fileId, fileIndex) => (
                                                    <div key={fileIndex} className="flex gap-2">
                                                        <FormField
                                                            control={form.control}
                                                            name={`knowledgeBases.${kbIndex}.fileIds.${fileIndex}`}
                                                            render={({ field }) => (
                                                                <FormItem className="flex-1">
                                                                    <FormControl>
                                                                        <Input readOnly {...field} placeholder="Enter file ID" />
                                                                    </FormControl>
                                                                    <FormMessage className='text-red-500 text-[12px]' />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            onClick={() => removeFileId(kbIndex, fileIndex)}
                                                            className="px-2"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </form>
                    </Form>
                </div>

                {/* Footer */}

            </div>
        </div>
    );
};

export default QueryToolComponent;