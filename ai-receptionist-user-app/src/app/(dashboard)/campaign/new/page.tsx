"use client"
import React from 'react'

import { ChevronLeft } from 'lucide-react'
import CampaignForm from '../form'
import { useRouter } from 'next/navigation'



type Props = {}

const NewCampaignPage = (props: Props) => {
    const router = useRouter()

    return (
        <div className="container mx-auto py-[24px]">
            <div className="flex  3xl:container items-center border-b pb-4 border-gray-200 justify-between">
                <div className="flex  gap-2">
                    <ChevronLeft className="cursor-pointer" onClick={() => { router.back() }} />
                    <div className="flex flex-col">
                        <h1 className="text-lg md:text-2xl font-semibold">New Campaign</h1>
                        <p className="text-sm mt-[7px] text-gray-500">Create a new campaign to start calling</p>
                    </div>

                </div>
                {/* <Button className="bg-[#4F46E5] rounded-[12px] text-white" onClick={() => { router.push("/campaign/new") }}><Plus className="mr-2" /> New Campaign</Button> */}
            </div>
            <div className="mt-5">
                <CampaignForm />
            </div>
        </div>
    )
}

export default NewCampaignPage