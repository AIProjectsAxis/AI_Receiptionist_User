"use client"
export const runtime = 'edge';

import { useEffect, useState, useRef, useCallback } from 'react'
import CustomSelect from '../ui/Select';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/component/ui/form";
import { Input } from '@/component/ui/input';
import axios from 'axios';
import { Search, Play, Pause } from 'lucide-react';
import Button from '../common/Button';
import { toast } from 'react-toastify';



interface ConfigureComponentProps {
    voiceRecording: boolean;
    setVoiceRecording: (value: boolean) => void;
    form: any;
    onStopVoice?: (stopFunction: () => void) => void;
}

const BASE_URL = "https://api.elevenlabs.io/v1/voices?show_legacy=true"

const ConfigureComponent = ({ voiceRecording, setVoiceRecording, form, onStopVoice }: ConfigureComponentProps) => {

    const [voices, setVoices] = useState<any[]>([{
        voice_id: "xrNwYO0xeioXswMCcFNF",
        name: "Ingmar - Intimately Mysterious",
        preview_url: "https://storage.googleapis.com/eleven-public-prod/database/user/iqZvP9uOFYfUw0BsDUQRmHyEHA02/voices/xrNwYO0xeioXswMCcFNF/FLZMQcL3u2BDyQksaRcN.mp3",
        labels: {
            accent: "american",
            descriptive: "whispery",
            gender: "male"
        },
        description: "Middle-aged male voice that captivates with its soft, husky tone."
    }]);
    type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Chinese' | 'Japanese';
    const [isLoadingVoices, setIsLoadingVoices] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
    const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
    const [isSelectingVoice, setIsSelectingVoice] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const stopVoiceRef = useRef<(() => void) | null>(null);

    const fetchVoices = async () => {
        try {
            setIsLoadingVoices(true);
            const response = await axios.get(BASE_URL);
            if (response?.data?.voices) {
                setVoices(response.data.voices);
            } else {
                console.error("Invalid response format:", response);
                // Fallback to default voice if API fails
                // setVoices([]);
            }
        } catch (error) {
            console.error("Error fetching voices:", error);
            // Fallback to default voice if API fails
            setVoices([{
                voice_id: "xrNwYO0xeioXswMCcFNF",
                name: "Ingmar - Intimately Mysterious",
                preview_url: "https://storage.googleapis.com/eleven-public-prod/database/user/iqZvP9uOFYfUw0BsDUQRmHyEHA02/voices/xrNwYO0xeioXswMCcFNF/FLZMQcL3u2BDyQksaRcN.mp3",
                labels: {
                    accent: "american",
                    descriptive: "whispery",
                    gender: "male"
                },
                description: "Middle-aged male voice that captivates with its soft, husky tone."
            }]);
        } finally {
            setIsLoadingVoices(false);
        }
    }

    const handleVoiceSelect = useCallback(async (voiceId: string) => {
        setIsSelectingVoice(true);
        try {
            // Stop any currently playing voice
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setPlayingVoice(null);

            form.setValue('voice', voiceId);
            setShowVoiceDropdown(false);
            // Simulate a small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error("Error selecting voice:", error);
        } finally {
            setIsSelectingVoice(false);
        }
    }, [form]);

    const playVoiceSample = useCallback((voiceId: string, previewUrl: string) => {
        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (playingVoice === voiceId) {
            setPlayingVoice(null);
            return;
        }

        audioRef.current = new Audio(previewUrl);
        audioRef.current.play();
        audioRef.current.onended = () => {
            setPlayingVoice(null);
        };
        setPlayingVoice(voiceId);
    }, [playingVoice]);

    const stopVoice = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingVoice(null);
    }, []);

    // Store the stopVoice function in ref
    useEffect(() => {
        stopVoiceRef.current = stopVoice;
    }, [stopVoice]);

    // Pass stopVoice function to parent component (only once)
    useEffect(() => {
        if (onStopVoice) {
            onStopVoice(() => {
                if (stopVoiceRef.current) {
                    stopVoiceRef.current();
                }
            });
        }
    }, [onStopVoice]);

    const filteredVoices = voices && Array.isArray(voices)
        ? voices.filter((voice: any) =>
            voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (voice.labels?.descriptive && voice.labels.descriptive.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (voice.labels?.gender && voice.labels.gender.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (voice.labels?.accent && voice.labels.accent.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : [];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowVoiceDropdown(false);
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowVoiceDropdown(false);
            }
        };

        if (showVoiceDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [showVoiceDropdown]);

    useEffect(() => {
        fetchVoices();
        form.setValue('recording_enabled', voiceRecording);
    }, [voiceRecording]);

    // Cleanup audio when component unmounts or tab changes
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setPlayingVoice(null);
        };
    }, []);



    // Set default voice when voices are loaded and no voice is selected
    useEffect(() => {
        if (voices.length > 0 && !form.getValues('voice')) {
            const defaultVoice = voices[0];
            form.setValue('voice', defaultVoice.voice_id);
        }
    }, [voices, form]);

    // Debug current form values
    useEffect(() => {
        const subscription = form.watch((value: any) => {
        });
        return () => subscription.unsubscribe();
    }, [form]);



    const selectedVoice = voices.find((v: any) => v.voice_id === form.getValues('voice'));

    // Function to determine dropdown direction
    const checkDropdownDirection = () => {
        if (!dropdownRef.current) return;
        const rect = dropdownRef.current.getBoundingClientRect();
        const dropdownHeight = 500; // max height of dropdown
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
            setDropdownDirection('up');
        } else {
            setDropdownDirection('down');
        }
    };

    // Check direction when opening dropdown
    useEffect(() => {
        if (showVoiceDropdown) {
            checkDropdownDirection();
            window.addEventListener('resize', checkDropdownDirection);
        }
        return () => {
            window.removeEventListener('resize', checkDropdownDirection);
        };
    }, [showVoiceDropdown]);

    return (
        <>
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Basic Configuration</h2>
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Agent Role</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="text"
                                    placeholder="Agent Role"
                                    className="w-full px-4 py-2 mb-4 border rounded border-gray-200 mt-2 text-gray-500"
                                    onBlur={() => {
                                        if (!field.value || field.value.trim() === '') {
                                            toast.error("Agent Role is required");
                                        }
                                    }}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

            </section>
            <section>
            <FormField
                    control={form.control}
                    name="detect_caller_number"
                    render={({ field }) => (
                        <FormItem className='mb-4'>
                            <FormControl>
                                <div className='flex justify-start items-start gap-2'>
                                    <input
                                        checked={form.getValues('detect_caller_number')}
                                        onChange={(e) => {
                                            console.log(e.target.checked);
                                            form.setValue('detect_caller_number', e.target.checked);
                                        }}
                                        type="checkbox"
                                        id="detect-caller-number"
                                        name="detectCallerNumber"
                                        className='border rounded p-2 border-gray-200 mt-[7px]'
                                    />
                                    <div>
                                        <h2 className="text-lg font-semibold mb-1">Detect Caller Number</h2>
                                        <p className="text-sm text-gray-500">Enable detection and identification of caller phone numbers</p>
                                    </div>
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />





            </section>





            {/* Voice Configuration */}
            <section className={`mb-8 space-y-4 ${form.formState.errors.languages ? ' ' : ''}`}>
                <h2 className="text-lg font-semibold mb-4">Voice Configuration</h2>

                <FormField
                    control={form.control}
                    name="languages"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className={form.formState.errors.languages ? 'text-red-500' : ''}>
                                Languages <span className="text-red-500">*</span>
                            </FormLabel>
                            <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${form.formState.errors.languages ? 'border-red-200' : ''}`}>
                                {(['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'] as Language[]).map((language) => (
                                    <div
                                        key={language}
                                        onClick={() => {
                                            const currentValue = field.value || [];
                                            const newValue = currentValue.includes(language)
                                                ? currentValue.filter((v: string) => v !== language)
                                                : [...currentValue, language];
                                            field.onChange(newValue);
                                            // Trigger validation after change
                                            form.trigger('languages').then((isValid: boolean) => {
                                                if (!isValid && newValue.length === 0) {
                                                    toast.error("Please select at least one language");
                                                }
                                            });
                                        }}
                                        className={`cursor-pointer p-4 rounded-lg border transition-all duration-200 ${field.value?.includes(language)
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : form.formState.errors.languages
                                                    ? 'border-red-300 hover:border-red-400 hover:bg-red-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="font-medium flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={field.value?.includes(language)}
                                                onChange={() => { }}
                                                className="h-4 w-4 text-blue-600 rounded"
                                            />
                                            {language}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {form.formState.errors.languages && (
                                <div className="text-red-500 text-sm mt-1">
                                    {form.formState.errors.languages.message}
                                </div>
                            )}
                            {!form.formState.errors.languages && (
                                <div className="text-gray-500 text-sm mt-1">
                                    Select at least one language for your assistant
                                </div>
                            )}
                            <FormMessage className='text-red-500 text-[12px]' />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="voice"
                        render={({ field }) => {
                            return (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-gray-700">Voice Selection</FormLabel>
                                    <div className="relative" ref={dropdownRef}>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                                            <FormControl>
                                                <div className="relative w-full ">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                                                        disabled={isLoadingVoices || isSelectingVoice}
                                                        className={`w-full h-auto  bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-primary hover:bg-white/90 focus:ring-2 focus:ring-primary/40 transition-all duration-200 rounded-xl shadow-sm px-4 py-3 text-left flex items-center justify-between group ${showVoiceDropdown ? 'border-primary bg-white shadow-md' : ''} ${(isLoadingVoices || isSelectingVoice) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    >
                                                        <div className="flex-1 w-full text-left">
                                                            {selectedVoice ? (
                                                                <div className="block rounded-lg p-2  transition-colors duration-150 w-full">

                                                                    <div className='flex flex-row items-center gap-2'>
                                                                        <p className="text-sm font-semibold text-gray-900 text-start">{selectedVoice.name}</p>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {selectedVoice.labels?.gender && (
                                                                                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-full font-medium">
                                                                                    {selectedVoice.labels.gender.charAt(0).toUpperCase() + selectedVoice.labels.gender.slice(1)}
                                                                                </span>
                                                                            )}
                                                                            {selectedVoice.labels?.accent && (
                                                                                <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-medium">
                                                                                    {selectedVoice.labels.accent.charAt(0).toUpperCase() + selectedVoice.labels.accent.slice(1)}
                                                                                </span>
                                                                            )}
                                                                            {selectedVoice.labels?.descriptive && (
                                                                                <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded-full font-medium">
                                                                                    {selectedVoice.labels.descriptive.charAt(0).toUpperCase() + selectedVoice.labels.descriptive.slice(1)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {selectedVoice.description && (
                                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                                            {selectedVoice.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-500 group-hover:text-gray-700 transition-colors duration-150">Choose a voice for your assistant</span>
                                                                    <div className="flex gap-1">
                                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Voice</span>
                                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">AI</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {isLoadingVoices && (
                                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                                                    <span>Loading...</span>
                                                                </div>
                                                            )}
                                                            {isSelectingVoice && (
                                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                                                    <span>Selecting...</span>
                                                                </div>
                                                            )}
                                                            {selectedVoice && !isLoadingVoices && !isSelectingVoice && (
                                                                <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors duration-150">
                                                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                                    <span>Selected</span>
                                                                </div>
                                                            )}
                                                            <svg
                                                                className={`w-4 h-4 text-gray-400 transition-all duration-200 flex-shrink-0 ml-2 group-hover:text-gray-600 ${showVoiceDropdown ? 'rotate-180 text-primary' : ''} ${(isLoadingVoices || isSelectingVoice) ? 'opacity-50' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </button>

                                                    {showVoiceDropdown && (
                                                        <div
                                                            className={`absolute left-0   right-0 z-[9999] bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200 w-full max-h-[500px] overflow-hidden ${dropdownDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} animate-fade-in`}
                                                            style={{ transition: 'box-shadow 0.2s, background 0.2s' }}
                                                            tabIndex={-1}
                                                        >
                                                            <div className="p-3 border-b border-gray-100">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                                                    <Input
                                                                        placeholder="Search voices by name, accent, gender..."
                                                                        className="pl-8 pr-2 text-sm border-gray-200 focus:ring-2 focus:ring-primary focus:outline-none rounded-md bg-white/80"
                                                                        value={searchQuery}
                                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="max-h-[350px] overflow-y-auto px-2 py-2 space-y-1 custom-scrollbar">
                                                                {isLoadingVoices ? (
                                                                    <div className="text-center py-4 text-sm text-gray-500">Loading voices...</div>
                                                                ) : filteredVoices.length > 0 ? (
                                                                    filteredVoices.map((voice: any) => (
                                                                        <div
                                                                            key={voice.voice_id}
                                                                            className={`group hover:bg-gray-100 transition-all duration-150 hover:bg-primary/10 cursor-pointer rounded-lg px-3 py-2 flex flex-col gap-1 border border-transparent focus-within:ring-2 focus-within:ring-primary/40 ${form.getValues('voice') === voice.voice_id ? 'bg-primary/20 border-primary/30 shadow' : ''
                                                                                } ${isSelectingVoice ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                            onClick={() => !isSelectingVoice && handleVoiceSelect(voice.voice_id)}
                                                                            tabIndex={0}
                                                                            onKeyDown={e => { if (e.key === 'Enter' && !isSelectingVoice) handleVoiceSelect(voice.voice_id); }}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <p className={`text-base font-semibold text-gray-900 ${form.getValues('voice') === voice.voice_id ? 'text-primary' : ''}`}>{voice.name}</p>
                                                                                {isSelectingVoice && form.getValues('voice') === voice.voice_id && (
                                                                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                                                                )}
                                                                                <div className="flex flex-wrap gap-1">
                                                                                    {voice.labels?.gender && (
                                                                                        <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-full font-medium">
                                                                                            {voice.labels.gender.charAt(0).toUpperCase() + voice.labels.gender.slice(1)}
                                                                                        </span>
                                                                                    )}
                                                                                    {voice.labels?.accent && (
                                                                                        <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-medium">
                                                                                            {voice.labels.accent.charAt(0).toUpperCase() + voice.labels.accent.slice(1)}
                                                                                        </span>
                                                                                    )}
                                                                                    {voice.labels?.descriptive && (
                                                                                        <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded-full font-medium">
                                                                                            {voice.labels.descriptive.charAt(0).toUpperCase() + voice.labels.descriptive.slice(1)}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {voice.description && (
                                                                                <p className={`text-xs text-gray-600 mt-1 line-clamp-2 ${form.getValues('voice') === voice.voice_id ? 'text-primary/80' : ''}`}>{voice.description}</p>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="text-center py-4 text-sm text-gray-500">No voices match your search</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>

                                            {field.value && selectedVoice && (
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="outline"
                                                    style={{ border: '1px solid #666666' }}
                                                    className="h-10 w-10 !p-0 border-1 border-primary rounded-lg bg-primary/10 hover:bg-primary/20 shadow-sm transition"
                                                    onClick={() => {
                                                        if (selectedVoice?.preview_url) {
                                                            playVoiceSample(selectedVoice.voice_id, selectedVoice.preview_url);
                                                        }
                                                    }}
                                                >
                                                    {playingVoice === field.value ? (
                                                        <Pause className="h-5 w-5 text-primary" />
                                                    ) : (
                                                        <Play className="h-5 w-5 text-primary" />
                                                    )}
                                                    <span className="sr-only">
                                                        {playingVoice === field.value ? "Pause" : "Play"} selected voice
                                                    </span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <FormMessage className="text-red-500 text-xs" />
                                </FormItem>
                            );
                        }}
                    />
                </div>
            </section>

            {/* Additional Settings */}
            {/* <section>
                <h2 className="text-base font-semibold mb-4">Additional Settings</h2>

                <FormField
                    control={form.control}
                    name="recording_enabled"
                    render={({ field }) => (
                        <div
                            className="flex items-center justify-between border rounded p-3 cursor-pointer border-gray-200"
                            onClick={() => {
                                const newValue = !voiceRecording;
                                setVoiceRecording(newValue);
                                field.onChange(newValue);
                            }}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="bg-purple-100 p-2 rounded-full">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-purple-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 18v3m0 0a6 6 0 01-6-6H5a7 7 0 0014 0h-1a6 6 0 01-6 6zm0-18a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-medium">Voice Recording</h4>
                                    <p className="text-sm text-gray-500">Record and save voice interactions</p>
                                </div>
                            </div>
                            <div
                                className={`relative w-11 h-[22px] rounded-full transition-colors duration-150 cursor-pointer ${field.value ? 'bg-purple-600' : 'bg-gray-200'}`}
                                role="switch"
                                aria-checked={field.value}
                                tabIndex={0}
                            >
                                <div
                                    className={`absolute left-[2px] top-[2px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-150 ${field.value ? 'translate-x-[25px]' : 'translate-x-0'}`}
                                />
                            </div>
                        </div>
                    )}
                />
            </section> */}

            {/* Add modern scrollbar style */}
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #e0e7ef;
                border-radius: 8px;
              }
              .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #e0e7ef transparent;
              }
              @keyframes fade-in {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in {
                animation: fade-in 0.18s cubic-bezier(.4,0,.2,1);
              }
            `}</style>
        </>
    )
}

export default ConfigureComponent