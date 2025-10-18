import React, { useState } from 'react'


const CustomFromComponent = ({setShowCustomForm , handleCustomSubmit , customData , setCustomData}:{setShowCustomForm: any , handleCustomSubmit: any , customData: any , setCustomData: any}) => {
  const [btnLoader, setBtnLoader] = useState(false)
  return (
    <>
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h2 className="text-xl font-semibold mb-4">Custom Function</h2>
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Custom Function Name</label>
                <input
                  type="text"
                  value="custom_function"
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value="Custom function description"
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Custom Field</label>
                <input
                  type="text"
                  value={customData.customField}
                  onChange={(e) => setCustomData({ ...customData, customField: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Custom field description"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Server URL</label>
                <input
                  type="text"
                  value="https://api.example.com/custom"
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Timeout (seconds)</label>
                <input
                  type="number"
                  value="30"
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"

                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {btnLoader && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> }
                  { "Execute Custom Function"}
                </button>
              </div>
            </form>
          </div>
        </div></>
  )
}

export default CustomFromComponent