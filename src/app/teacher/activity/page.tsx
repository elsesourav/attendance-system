"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
   FiActivity,
   FiArrowLeft,
   FiBook,
   FiCalendar,
   FiClock,
   FiUsers,
} from "react-icons/fi";

interface ActivityItem {
   id: number;
   type: string;
   date: string;
   timestamp: number;
   description: string;
   link: string;
}

export default function TeacherActivityPage() {
   const { data: session } = useSession();
   const router = useRouter();
   const [activities, setActivities] = useState<ActivityItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [filter, setFilter] = useState<string>("all");

   // Get current month and year for default filters
   const today = new Date();
   const [filterMonth, setFilterMonth] = useState<string>(
      String(today.getMonth() + 1)
   );
   const [filterYear, setFilterYear] = useState<string>(
      String(today.getFullYear())
   );

   useEffect(() => {
      const fetchActivity = async () => {
         setIsLoading(true);
         try {
            const url = `/api/teacher/activity?month=${filterMonth}&year=${filterYear}`;
            const response = await fetch(url);
            if (response.ok) {
               const data = await response.json();
               setActivities(data);
            }
         } catch (error) {
            console.error("Error fetching activity:", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchActivity();
   }, [filterMonth, filterYear]);

   // Function to get the appropriate icon for each activity type
   const getActivityIcon = (type: string) => {
      switch (type) {
         case "attendance":
            return <FiCalendar className="h-4 w-4" />;
         case "enrollment":
            return <FiUsers className="h-4 w-4" />;
         case "subject":
            return <FiBook className="h-4 w-4" />;
         case "stream":
            return <FiBook className="h-4 w-4" />;
         default:
            return <FiActivity className="h-4 w-4" />;
      }
   };

   // Function to get the appropriate badge color for each activity type
   const getActivityBadgeClass = (type: string) => {
      switch (type) {
         case "attendance":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
         case "enrollment":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
         case "subject":
            return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
         case "stream":
            return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
         default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      }
   };

   // Function to format the date in a readable format
   const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if the date is today
      if (date.toDateString() === now.toDateString()) {
         return "Today";
      }

      // Check if the date is yesterday
      if (date.toDateString() === yesterday.toDateString()) {
         return "Yesterday";
      }

      // Otherwise, return the formatted date
      return date.toLocaleDateString(undefined, {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   // Group activities by date
   const groupedActivities = activities.reduce(
      (acc: { [key: string]: ActivityItem[] }, activity) => {
         const dateKey = new Date(activity.date).toDateString();
         if (!acc[dateKey]) {
            acc[dateKey] = [];
         }
         acc[dateKey].push(activity);
         return acc;
      },
      {}
   );

   // Filter activities based on selected type
   const filteredActivities =
      filter === "all"
         ? activities
         : activities.filter((activity) => activity.type === filter);

   return (
      <div className="space-y-6">
         <div className="flex items-center">
            <Button
               variant="ghost"
               size="icon"
               className="mr-2"
               onClick={() => router.push("/teacher/dashboard")}
            >
               <FiArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Activity History</h1>
         </div>

         <div className="flex flex-col space-y-4 mb-4">
            <div className="flex flex-wrap gap-2">
               <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
               >
                  All
               </Button>
               <Button
                  variant={filter === "attendance" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("attendance")}
               >
                  <FiCalendar className="mr-2 h-4 w-4" />
                  Attendance
               </Button>
               <Button
                  variant={filter === "enrollment" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("enrollment")}
               >
                  <FiUsers className="mr-2 h-4 w-4" />
                  Enrollments
               </Button>
               <Button
                  variant={filter === "subject" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("subject")}
               >
                  <FiBook className="mr-2 h-4 w-4" />
                  Subjects
               </Button>
               <Button
                  variant={filter === "stream" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("stream")}
               >
                  <FiBook className="mr-2 h-4 w-4" />
                  Streams
               </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
               <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium">Month/Year:</div>
                  <select
                     className="h-9 rounded-md border border-input px-3 py-1"
                     value={filterMonth}
                     onChange={(e) => setFilterMonth(e.target.value)}
                  >
                     <option value="1">January</option>
                     <option value="2">February</option>
                     <option value="3">March</option>
                     <option value="4">April</option>
                     <option value="5">May</option>
                     <option value="6">June</option>
                     <option value="7">July</option>
                     <option value="8">August</option>
                     <option value="9">September</option>
                     <option value="10">October</option>
                     <option value="11">November</option>
                     <option value="12">December</option>
                  </select>

                  <select
                     className="h-9 rounded-md border border-input px-3 py-1"
                     value={filterYear}
                     onChange={(e) => setFilterYear(e.target.value)}
                  >
                     {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - i
                     ).map((year) => (
                        <option key={`year-${year}`} value={year}>
                           {year}
                        </option>
                     ))}
                  </select>

                  <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                        const now = new Date();
                        setFilterMonth(String(now.getMonth() + 1));
                        setFilterYear(String(now.getFullYear()));
                     }}
                  >
                     Current Month
                  </Button>
               </div>
            </div>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>Activity Log</CardTitle>
               <CardDescription>
                  {filter === "all"
                     ? `Activities for ${new Date(
                          parseInt(filterYear),
                          parseInt(filterMonth) - 1
                       ).toLocaleDateString(undefined, {
                          month: "long",
                          year: "numeric",
                       })}`
                     : `${
                          filter.charAt(0).toUpperCase() + filter.slice(1)
                       } activities for ${new Date(
                          parseInt(filterYear),
                          parseInt(filterMonth) - 1
                       ).toLocaleDateString(undefined, {
                          month: "long",
                          year: "numeric",
                       })}`}
               </CardDescription>
            </CardHeader>
            <CardContent>
               {isLoading ? (
                  <div className="space-y-4">
                     {Array.from({ length: 5 }).map((_, i) => (
                        <div
                           key={`skeleton-${i}`}
                           className="flex items-start space-x-4"
                        >
                           <Skeleton className="h-10 w-10 rounded-full" />
                           <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                           </div>
                        </div>
                     ))}
                  </div>
               ) : filteredActivities.length === 0 ? (
                  <div className="text-center py-6 bg-muted/20 rounded-lg">
                     <p className="text-muted-foreground">
                        No activity records found.
                     </p>
                  </div>
               ) : (
                  <div className="space-y-8">
                     {Object.entries(groupedActivities)
                        .sort(
                           ([dateA], [dateB]) =>
                              new Date(dateB).getTime() -
                              new Date(dateA).getTime()
                        )
                        .map(([date, dateActivities]) => {
                           // Filter activities for this date based on the selected filter
                           const filteredDateActivities =
                              filter === "all"
                                 ? dateActivities
                                 : dateActivities.filter(
                                      (activity) => activity.type === filter
                                   );

                           if (filteredDateActivities.length === 0) {
                              return null;
                           }

                           return (
                              <div key={date} className="space-y-4">
                                 <h3 className="font-medium text-muted-foreground">
                                    {formatDate(date)}
                                 </h3>
                                 <div className="space-y-4 pl-4 border-l">
                                    {filteredDateActivities.map((activity, i) => (
                                       <div
                                          key={i}
                                          className="flex items-start space-x-4"
                                       >
                                          <div className="mt-1 bg-muted rounded-full p-2">
                                             {getActivityIcon(activity.type)}
                                          </div>
                                          <div className="flex-1">
                                             <div className="flex items-center justify-between">
                                                <div className="font-medium">
                                                   {activity.description}
                                                </div>
                                                <Badge
                                                   variant="outline"
                                                   className={getActivityBadgeClass(
                                                      activity.type
                                                   )}
                                                >
                                                   {activity.type
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                      activity.type.slice(1)}
                                                </Badge>
                                             </div>
                                             <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                                <FiClock className="mr-1 h-3 w-3" />
                                                <span>
                                                   {new Date(
                                                      activity.timestamp
                                                   ).toLocaleTimeString()}
                                                </span>
                                                <Link
                                                   href={activity.link}
                                                   className="ml-auto text-sm text-primary hover:underline"
                                                >
                                                   View Details
                                                </Link>
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           );
                        })}
                  </div>
               )}
            </CardContent>
         </Card>
      </div>
   );
}
