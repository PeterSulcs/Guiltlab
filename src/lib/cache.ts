import { prisma } from '@/lib/prisma';

/**
 * Invalidate cache entries for a specific instance
 * @param instanceId The instance ID to invalidate cache for
 */
export async function invalidateInstanceCache(instanceId: string) {
  try {
    // Delete all cache entries for this instance
    await prisma.cache.deleteMany({
      where: {
        instanceId
      }
    });
    
    console.log(`Cache invalidated for instance: ${instanceId}`);
  } catch (error) {
    console.error('Error invalidating cache:', error);
    throw error;
  }
}

/**
 * Invalidate cache entries for a specific user
 * @param instanceId The instance ID
 * @param username The username
 */
export async function invalidateUserCache(instanceId: string, username: string) {
  try {
    // Delete cache entries for this user in this instance
    await prisma.cache.deleteMany({
      where: {
        instanceId,
        username
      }
    });
    
    console.log(`Cache invalidated for user: ${instanceId}/${username}`);
  } catch (error) {
    console.error('Error invalidating cache:', error);
    throw error;
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache() {
  try {
    // Delete all expired cache entries
    await prisma.cache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    console.log('Expired cache entries cleared');
  } catch (error) {
    console.error('Error clearing expired cache:', error);
    throw error;
  }
}
