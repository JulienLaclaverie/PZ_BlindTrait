#version 110

varying vec3 vertColour; 
varying vec3 vertNormal;
varying vec2 texCoords;

uniform sampler2D Texture;

uniform vec3 TintColour;

uniform vec3 AmbientColour;
uniform vec3 Light0Direction;
uniform vec3 Light0Colour;
uniform vec3 Light1Direction;
uniform vec3 Light1Colour;
uniform vec3 Light2Direction;
uniform vec3 Light2Colour;

vec3 desaturate(vec3 color, float amount)
{
    vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), color));
    return vec3(mix(color, gray, amount));
}

void quantise(inout float amount, float steps)
{
	amount *= steps;
	amount = ceil(amount);
	amount /= steps;
}

float max(float a, float b)
{
    if(a > b) return a;
    return b;
}

float clamp(float a, float b, float c)
{
    if(a > c) return c;
    if(a < b) return b;
    return a;
}

void main()
{
	vec3 normal = normalize(vertNormal);
	vec3 col = texture2D(Texture, texCoords).xyz;
	float dotprod;
	float pixelVal = (col.x + col.y + col.z) / 3.0;

	vec3 lighting = AmbientColour;
	dotprod = max(dot(normal, normalize(Light0Direction)), 0.0);
	quantise(dotprod, 3.0);
	lighting += Light0Colour * dotprod;

	dotprod = max(dot(normal, normalize(Light1Direction)), 0.0);
	quantise(dotprod, 3.0);
	lighting += Light1Colour * dotprod;

	dotprod = max(dot(normal, normalize(Light2Direction)), 0.0);
	quantise(dotprod, 3.0);
	lighting += Light2Colour * dotprod;

    vec3 TintColourNew = desaturate(TintColour, 0.3);
	lighting.x = clamp(lighting.x, 0.0, 1.0);
	lighting.y = clamp(lighting.y, 0.0, 1.0);
	lighting.z = clamp(lighting.z, 0.0, 1.0);

	col = vec3(col.x * lighting.x * TintColourNew.x, col.y * lighting.y * TintColourNew.y, col.z * lighting.z * TintColourNew.z);

	gl_FragColor = vec4(0.15, 0.15, 0.15, 1.0);
}