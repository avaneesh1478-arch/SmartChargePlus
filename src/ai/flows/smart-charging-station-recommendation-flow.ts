'use server';
/**
 * @fileOverview An AI tool to recommend optimal EV charging stations to end users.
 *
 * - smartChargingStationRecommendation - A function that handles the charging station recommendation process.
 * - SmartChargingStationRecommendationInput - The input type for the smartChargingStationRecommendation function.
 * - SmartChargingStationRecommendationOutput - The return type for the smartChargingStationRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartChargingStationRecommendationInputSchema = z.object({
  userLocation: z
    .object({
      latitude: z.number().describe('The user\'s current latitude.'),
      longitude: z.number().describe('The user\'s current longitude.'),
    })
    .describe('The current geographic location of the user.'),
  vehicleChargerType: z
    .enum(['Level 2', 'DCFC'])
    .describe('The required charger type for the user\'s vehicle (Level 2 or DCFC).'),
  preference: z
    .enum(['minimizeCost', 'maximizeSpeed'])
    .describe('The user\'s preference: to minimize charging costs or maximize charging speed.'),
  availableStations: z
    .array(
      z.object({
        station_id: z.string().describe('Unique identifier for the station.'),
        name: z.string().describe('Name of the charging station.'),
        location: z.string().describe('Address or general location description of the station.'),
        charger_types: z
          .array(z.enum(['Level 2', 'DCFC']))
          .describe('Array of charger types available at this station.'),
        current_load_percentage: z
          .number()
          .min(0)
          .max(100)
          .describe('Current load as a percentage (0-100), where 0 is fully available and 100 is fully occupied.'),
        rate_per_kwh: z.number().describe('Cost per kilowatt-hour at this station.'),
      })
    )
    .describe('A list of nearby available charging stations with their details.'),
});
export type SmartChargingStationRecommendationInput = z.infer<
  typeof SmartChargingStationRecommendationInputSchema
>;

const SmartChargingStationRecommendationOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        station_id: z.string().describe('Unique identifier of the recommended station.'),
        station_name: z.string().describe('Name of the recommended charging station.'),
        reason: z.string().describe('A brief explanation for why this station is recommended.'),
      })
    )
    .describe('A list of optimal charging station recommendations.'),
});
export type SmartChargingStationRecommendationOutput = z.infer<
  typeof SmartChargingStationRecommendationOutputSchema
>;

export async function smartChargingStationRecommendation(
  input: SmartChargingStationRecommendationInput
): Promise<SmartChargingStationRecommendationOutput> {
  return smartChargingStationRecommendationFlow(input);
}

const smartChargingStationRecommendationPrompt = ai.definePrompt({
  name: 'smartChargingStationRecommendationPrompt',
  input: {schema: SmartChargingStationRecommendationInputSchema},
  output: {schema: SmartChargingStationRecommendationOutputSchema},
  prompt: `You are an expert EV charging station recommendation assistant. Your goal is to help users find the most optimal charging stations based on their specific needs and preferences.

Here is the user's information and available station data:

User Location: Latitude {{{userLocation.latitude}}}, Longitude {{{userLocation.longitude}}}
Vehicle Charger Type Required: {{{vehicleChargerType}}}
User Preference: {{{preference}}} (minimize charging costs or maximize charging speed)

Available Stations:
{{#each availableStations}}
- Station ID: {{{station_id}}}
  Name: {{{name}}}
  Location: {{{location}}}
  Available Charger Types: {{#each charger_types}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Current Load Percentage: {{{current_load_percentage}}}%
  Rate per kWh: {{{rate_per_kwh}}}
{{/each}}

Given the user's requirements and the available stations, please recommend 1 to 3 optimal charging stations. Prioritize stations that are compatible with the vehicle\'s charger type. Then, consider the user's preference:

- If the preference is 'minimizeCost', prioritize stations with lower 'rate_per_kwh' and reasonable availability.
- If the preference is 'maximizeSpeed', prioritize stations with lower 'current_load_percentage' (higher availability) and compatible charger types (DCFC if available and needed).

For each recommendation, provide the 'station_id', 'station_name', and a concise 'reason' explaining why it is optimal based on the input data.`,
});

const smartChargingStationRecommendationFlow = ai.defineFlow(
  {
    name: 'smartChargingStationRecommendationFlow',
    inputSchema: SmartChargingStationRecommendationInputSchema,
    outputSchema: SmartChargingStationRecommendationOutputSchema,
  },
  async input => {
    const {output} = await smartChargingStationRecommendationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate charging station recommendations.');
    }
    return output;
  }
);
