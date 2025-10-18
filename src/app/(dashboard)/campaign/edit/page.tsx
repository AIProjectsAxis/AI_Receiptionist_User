"use client"

import { ChevronLeft, Loader2 } from "lucide-react"
import {  useSearchParams } from "next/navigation"
import CampaignForm from "../form"
import { useEffect, useState } from "react"
import { getCampaignByIdApiRequest } from "@/network/api"
import { useRouter } from "next/navigation"

const EditCampaign = () => {
   
    const isEdit = "true"
    const router = useRouter()
    const [loading, setLoading] = useState<boolean>(false)


    return (
        <div className="container mx-auto py-[24px]">
            <div className="flex items-center gap-2">
                <ChevronLeft className="cursor-pointer" onClick={() => { router.push("/campaign") }} />
                <h1 className="text-lg md:text-2xl font-semibold">Edit Campaign</h1>
            </div>
            <div className="mt-5">
                {loading && <div className="h-full text-center w-full flex justify-center items-center content-center mt-10">
                    <Loader2 className="mr-2 animate-spin" size={50} />
                </div>}
                {!loading && <CampaignForm isEdit={isEdit}  />}
            </div>
        </div>
    )
}

export default EditCampaign