"use client";

import { useLoading } from "@/components/loading-overlay";
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
import { useEffect, useState } from "react";
import {
   FiActivity,
   FiBook,
   FiCalendar,
   FiClock,
   FiPlus,
   FiUsers,
} from "react-icons/fi";

interface DashboardStats {
   streamCount: number;
   subjectCount: number;
   studentCount: number;
}

interface ActivityItem {
   id: number;
   type: string;
   date: string;
   timestamp: number;
   description: string;
   link: string;
}

export default function TeacherDashboard() {
   const { data: session } = useSession();
   const { hideLoading } = useLoading();
   const [stats, setStats] = useState<DashboardStats>({
      streamCount: 0,
      subjectCount: 0,
      studentCount: 0,
   });
   const [activities, setActivities] = useState<ActivityItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isLoadingActivity, setIsLoadingActivity] = useState(true);

   // Hide loading overlay when component mounts
   useEffect(() => {
      hideLoading();
   }, [hideLoading]);

   useEffect(() => {
      const fetchStats = async () => {
         try {
            const response = await fetch("/api/teacher/stats");
            if (response.ok) {
               const data = await response.json();
               setStats(data);
            }
         } catch (error) {
            console.error("Error fetching stats:", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchStats();
   }, []);

   useEffect(() => {
      const fetchActivity = async () => {
         try {
            const response = await fetch("/api/teacher/activity");
            if (response.ok) {
               const data = await response.json();
               setActivities(data);
            }
         } catch (error) {
            console.error("Error fetching activity:", error);
         } finally {
            setIsLoadingActivity(false);
         }
      };

      fetchActivity();
   }, []);

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

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <Link href="/teacher/streams/create" onClick={() => hideLoading()}>
               <Button className="w-full sm:w-auto">
                  <FiPlus className="mr-2" />
                  Create Stream
               </Button>
            </Link>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Streams
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center">
                     <FiBook className="mr-2 h-4 w-4 text-muted-foreground" />
                     <div className="text-2xl font-bold">
                        {isLoading ? "..." : stats.streamCount}
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Subjects
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center">
                     <FiBook className="mr-2 h-4 w-4 text-muted-foreground" />
                     <div className="text-2xl font-bold">
                        {isLoading ? "..." : stats.subjectCount}
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     Students
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center">
                     <FiUsers className="mr-2 h-4 w-4 text-muted-foreground" />
                     <div className="text-2xl font-bold">
                        {isLoading ? "..." : stats.studentCount}
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>

         <div className="grid grid-cols-1 gap-6">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                     <CardTitle>Recent Activity</CardTitle>
                     <CardDescription>
                        Your recent actions in the system
                     </CardDescription>
                  </div>
                  <Link href="/teacher/activity">
                     <Button variant="outline" size="sm">
                        View All
                     </Button>
                  </Link>
               </CardHeader>
               <CardContent>
                  {isLoadingActivity ? (
                     <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                           <div key={i} className="flex items-start space-x-4">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2 flex-1">
                                 <Skeleton className="h-4 w-full" />
                                 <Skeleton className="h-4 w-3/4" />
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : activities.length === 0 ? (
                     <div className="text-center py-6 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">
                           No recent activity to display.
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {activities.map((activity, i) => (
                           <div key={i} className="flex items-start space-x-4">
                              <div className="mt-1 bg-muted rounded-full p-2">
                                 {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1">
                                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="font-medium line-clamp-2">
                                       {activity.description}
                                    </div>
                                    <Badge
                                       variant="outline"
                                       className={`whitespace-nowrap ${getActivityBadgeClass(
                                          activity.type
                                       )}`}
                                    >
                                       {activity.type.charAt(0).toUpperCase() +
                                          activity.type.slice(1)}
                                    </Badge>
                                 </div>
                                 <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                    <FiClock className="mr-1 h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">
                                       {formatDate(activity.date)}
                                    </span>
                                    <Link
                                       href={activity.link}
                                       className="ml-auto text-sm text-primary hover:underline flex-shrink-0"
                                       onClick={() => hideLoading()}
                                    >
                                       View
                                    </Link>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
