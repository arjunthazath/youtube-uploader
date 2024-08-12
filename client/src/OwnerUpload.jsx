import React, { useState, useEffect } from 'react';
import logo from './assets/uploader-logo.png';
import axios from 'axios';
import { Disclosure, Menu } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Home', href: '#', current: true },
  { name: 'Videos', href: '#', current: false },
  { name: 'Profile', href: '#', current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function OwnerUpload() {
  const [videoId, setVideoId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [privacyStatus, setPrivacyStatus] = useState('public');
  const [message, setMessage] = useState(''); // For user feedback

  useEffect(() => {
    // Fetch video details from the backend
    const fetchVideoDetails = async () => {
      try {
        const response = await axios.get('http://localhost:5000/latest-video');
        const { videoId, title, description, keywords, privacyStatus } = response.data;
        setVideoId(videoId);
        setTitle(title);
        setDescription(description);
        setKeywords(keywords);
        setPrivacyStatus(privacyStatus);
      } catch (error) {
        console.error('Error fetching video details:', error);
        setMessage('Failed to fetch video details.');
      }
    };

    fetchVideoDetails();
  }, []);


  const handleApprove = async () => {
    try {
      const response = await axios.post('http://localhost:5000/approve', {
        videoId,
        title,
        description,
        keywords,
        privacyStatus, // Use the updated privacy status
      });
      console.log(response.data);
      setMessage('Video approved and details updated successfully.');
    } catch (error) {
      console.error('Error changing privacy status:', error);
      setMessage('Failed to approve the video.');
    }
  };

  const handleReject = async () => {
    try {
      // Implement rejection logic here, e.g., delete the video or notify the uploader
      const response = await axios.post('http://localhost:5000/reject', {
        videoId,
      });
      console.log(response.data);
      setMessage('Video rejected successfully.');
    } catch (error) {
      console.error('Error rejecting the video:', error);
      setMessage('Failed to reject the video.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Disclosure as="nav" className="bg-white">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 items-center justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="flex flex-shrink-0 items-center mr-96">
                    <img className="h-8 w-auto" src={logo} alt="Your Company" />
                  </div>
                  <div className="hidden sm:ml-6 sm:block">
                    <div className="flex space-x-4">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className={classNames(
                            item.current ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-700 hover:text-white',
                            'rounded-md px-3 py-2 text-sm font-medium'
                          )}
                          aria-current={item.current ? 'page' : undefined}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  <button
                    type="button"
                    className="relative rounded-full bg-red-600 p-1 text-white hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>

                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="sr-only">Open user menu</span>
                        <img
                          className="h-8 w-8 rounded-full"
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                          alt=""
                        />
                      </Menu.Button>
                    </div>
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#"
                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                          >
                            Your Profile
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#"
                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                          >
                            Settings
                          </a>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#"
                            className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                          >
                            Sign out
                          </a>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={classNames(
                      item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'block rounded-md px-3 py-2 text-base font-medium'
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <div className="flex flex-row flex-grow">
        <div className="flex flex-col items-center justify-center flex-grow bg-red-500 max-w-screen-sm">
          <div className="mb-9 transition-transform duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg">
            {videoId ? (
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <p>Loading video...</p>
            )}
          </div>
          <textarea
            className="w-96 h-24 border rounded p-2 hover:border-black"
            placeholder="Comments for Editor"
          />
        </div>

        <div className="flex flex-col items-center justify-center flex-grow bg-black max-w-screen-sm">
          <div className="p-7 w-4/4 max-w-xl text-center">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)} // Allow updates to the title
              className="mb-7 p-4 border border-gray-300 rounded w-full bg-gray-200"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)} // Allow updates to the description
              className="mb-7 p-4 border border-gray-300 rounded w-full bg-gray-200"
            />
            <input
              type="text"
              placeholder="Keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)} // Allow updates to the keywords
              className="mb-8 p-4 border border-gray-300 rounded w-full bg-gray-200"
            />
            <select
              value={privacyStatus}
              onChange={(e) => setPrivacyStatus(e.target.value)} // Allow updates to the privacy status
              className="mb-4 p-4 border border-gray-300 rounded w-full"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
            </select>
            <div className="flex justify-evenly">
              <button
                onClick={handleApprove}
                className="bg-green-500 text-white w-24 p-3 rounded-xl mt-10 font-semibold font-sans"
              >
                APPROVE
              </button>
              <button
                onClick={handleReject}
                className="bg-red-500 text-white w-24 p-3 rounded-xl mt-10 font-semibold font-sans"
              >
                REJECT
              </button>
            </div>
            {message && (
              <div className="mt-5">
                <p>{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
